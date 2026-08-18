import type { Order, Payout } from '@shootsenegal/shared';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const PAYOUT_STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  completed: 'Payé',
  rejected: 'Rejeté',
};

const PAYOUT_METHODS: { value: 'wave' | 'orange_money' | 'banque'; label: string }[] = [
  { value: 'wave', label: 'Wave' },
  { value: 'orange_money', label: 'Orange Money' },
  { value: 'banque', label: 'Banque' },
];

function formatFCFA(amount: number) {
  return `${amount.toLocaleString('fr-FR')} F CFA`;
}

export default function Sales() {
  const { profile } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [available, setAvailable] = useState(0);
  const [photographerId, setPhotographerId] = useState<string | null>(null);

  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState<'wave' | 'orange_money' | 'banque'>('wave');
  const [details, setDetails] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: photographer } = await supabase
      .from('photographers')
      .select('id, commission_rate')
      .eq('profile_id', profile.id)
      .single();
    if (!photographer) return;
    setPhotographerId(photographer.id);

    const [{ data: ordersData }, { data: payoutsData }, { data: subscription }] = await Promise.all([
      supabase.from('orders').select('*').eq('photographer_id', photographer.id).order('created_at', { ascending: false }),
      supabase.from('payouts').select('*').eq('photographer_id', photographer.id).order('requested_at', { ascending: false }),
      supabase.from('subscriptions').select('plans(commission_rate)').eq('photographer_id', photographer.id).eq('status', 'active').single(),
    ]);

    setOrders(ordersData ?? []);
    setPayouts(payoutsData ?? []);

    const plan = subscription?.plans as { commission_rate: number } | { commission_rate: number }[] | null;
    const commissionRate = (Array.isArray(plan) ? plan[0]?.commission_rate : plan?.commission_rate) ?? 70;
    const revenue = (ordersData ?? []).filter((o) => o.status === 'payee').reduce((sum, o) => sum + o.total_fcfa, 0);
    const share = Math.floor((revenue * commissionRate) / 100);
    const withdrawn = (payoutsData ?? [])
      .filter((p) => p.status === 'pending' || p.status === 'completed')
      .reduce((sum, p) => sum + p.amount_fcfa, 0);
    setAvailable(Math.max(0, share - withdrawn));
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const requestPayout = async () => {
    setError(null);
    setSubmitting(true);
    try {
      await apiFetch('/api/photographers/payouts', {
        method: 'POST',
        body: JSON.stringify({ amount_fcfa: Number(amount), payout_method: method, payout_details: details }),
      });
      setAmount('');
      setDetails('');
      load();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  if (orders === null || !photographerId) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white">
        <ActivityIndicator color="#ff8e00" />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-sn-white"
      data={orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: 16, gap: 8 }}
      ListHeaderComponent={
        <View className="mb-4">
          <Text className="text-2xl font-bold text-sn-slate">Ventes</Text>
          <Text className="mt-2 text-sn-slate">
            Solde disponible : <Text className="text-lg font-bold text-sn-orange">{formatFCFA(available)}</Text>
          </Text>

          {available > 0 && (
            <View className="mt-4 rounded-xl border border-gray-100 bg-white p-4">
              <Text className="mb-2 font-semibold text-sn-slate">Demander un retrait (Wave)</Text>
              <FormInput label="Montant (F CFA)" value={amount} onChangeText={setAmount} keyboardType="numeric" />
              <View className="mb-4 flex-row gap-2">
                {PAYOUT_METHODS.map((m) => (
                  <Pressable
                    key={m.value}
                    onPress={() => setMethod(m.value)}
                    className={`rounded-lg border px-3 py-2 ${
                      method === m.value ? 'border-sn-orange bg-sn-orange/10' : 'border-gray-300'
                    }`}
                  >
                    <Text className={method === m.value ? 'text-xs font-semibold text-sn-orange' : 'text-xs text-sn-slate'}>
                      {m.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <FormInput
                label={method === 'banque' ? 'Coordonnées bancaires' : 'Numéro'}
                value={details}
                onChangeText={setDetails}
              />
              {error ? <Text className="mb-2 text-sn-orange">{error}</Text> : null}
              <PrimaryButton title="Demander le retrait" onPress={requestPayout} loading={submitting} disabled={!amount || !details} />
            </View>
          )}

          {payouts.length > 0 && (
            <View className="mt-4">
              <Text className="mb-2 font-semibold text-sn-slate">Mes retraits</Text>
              {payouts.map((p) => (
                <View key={p.id} className="flex-row items-center justify-between border-b border-gray-100 py-2">
                  <Text className="text-sn-teal">{formatFCFA(p.amount_fcfa)}</Text>
                  <Text className="text-xs text-gray-400">{PAYOUT_STATUS_LABEL[p.status]}</Text>
                </View>
              ))}
            </View>
          )}

          <Text className="mb-2 mt-6 font-semibold text-sn-slate">Commandes</Text>
        </View>
      }
      ListEmptyComponent={<Text className="text-center text-sn-slate">Aucune commande.</Text>}
      renderItem={({ item }) => (
        <View className="flex-row items-center justify-between rounded-lg border border-gray-100 bg-white p-3">
          <Text className="font-mono text-xs text-gray-500">{item.order_number}</Text>
          <Text className="text-sn-slate">{formatFCFA(item.total_fcfa)}</Text>
          <Text className="text-xs capitalize text-gray-400">{item.status}</Text>
        </View>
      )}
    />
  );
}
