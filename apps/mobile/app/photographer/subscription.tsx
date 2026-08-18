import type { Plan } from '@shootsenegal/shared';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

function formatFCFA(amount: number) {
  return `${amount.toLocaleString('fr-FR')} F CFA`;
}

export default function Subscription() {
  const { profile } = useAuth();
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[] | null>(null);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [paying, setPaying] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const { data: plansData } = await supabase.from('plans').select('*').eq('is_active', true).order('sort_order');
    setPlans(plansData ?? []);

    if (!profile) return;
    const { data: photographer } = await supabase
      .from('photographers')
      .select('id')
      .eq('profile_id', profile.id)
      .single();
    if (!photographer) return;
    const { data: subscription } = await supabase
      .from('subscriptions')
      .select('plan_id')
      .eq('photographer_id', photographer.id)
      .eq('status', 'active')
      .single();
    setActivePlanId(subscription?.plan_id ?? null);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const subscribe = async (planId: string, paymentMethod: 'stripe' | 'kkiapay') => {
    setPaying(planId + paymentMethod);
    setError(null);
    try {
      const data = await apiFetch('/api/photographers/subscribe', {
        method: 'POST',
        body: JSON.stringify({ plan_id: planId, payment_method: paymentMethod }),
      });

      if (paymentMethod === 'stripe' && data.checkout_url) {
        const result = await WebBrowser.openAuthSessionAsync(data.checkout_url, 'senshootapp://payment-return');
        if (result.type === 'success') load();
      } else if (paymentMethod === 'kkiapay' && data.subscription_payment_id) {
        router.push({
          pathname: '/checkout/kkiapay',
          params: { kind: 'subscription', id: data.subscription_payment_id, amount: String(data.amount) },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setPaying(null);
    }
  };

  if (plans === null) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white">
        <ActivityIndicator color="#ff8e00" />
      </View>
    );
  }

  return (
    <ScrollView className="flex-1 bg-sn-white" contentContainerClassName="p-4 gap-4">
      <Text className="mb-2 text-2xl font-bold text-sn-slate">Abonnement</Text>
      {error ? <Text className="text-sn-orange">{error}</Text> : null}
      {plans.map((plan) => (
        <View key={plan.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <Text className="font-bold text-sn-teal">{plan.name}</Text>
          <Text className="mt-1 text-xl font-extrabold text-sn-slate">
            {formatFCFA(plan.price_fcfa)} <Text className="text-sm font-normal text-gray-400">/ mois</Text>
          </Text>

          {plan.id === activePlanId ? (
            <Text className="mt-4 text-center text-sm font-medium text-sn-teal">Formule actuelle</Text>
          ) : (
            <View className="mt-4 flex-row gap-2">
              <View className="flex-1">
                <PrimaryButton
                  title="Wave / OM"
                  variant="outline"
                  onPress={() => subscribe(plan.id, 'kkiapay')}
                  loading={paying === plan.id + 'kkiapay'}
                />
              </View>
              <View className="flex-1">
                <PrimaryButton
                  title="Carte"
                  onPress={() => subscribe(plan.id, 'stripe')}
                  loading={paying === plan.id + 'stripe'}
                />
              </View>
            </View>
          )}
        </View>
      ))}
      {!plans.length && <Text className="text-center text-sn-slate">Aucune formule disponible.</Text>}
    </ScrollView>
  );
}
