import type { Order } from '@shootsenegal/shared';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type OrderWithToken = Order & { order_access_tokens: { token: string; used_at: string | null }[] };

const STATUS_LABEL: Record<string, string> = {
  en_attente: 'En attente',
  payee: 'Payée',
  echouee: 'Échouée',
  annulee: 'Annulée',
  remboursee: 'Remboursée',
};

export default function ClientOrders() {
  const { session } = useAuth();
  const router = useRouter();
  const [orders, setOrders] = useState<OrderWithToken[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('orders')
      .select('*, order_access_tokens(token, used_at)')
      .eq('client_id', session.user.id)
      .order('created_at', { ascending: false });
    setOrders((data as OrderWithToken[]) ?? []);
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  if (orders === null) {
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
      contentContainerStyle={{ padding: 16, gap: 12 }}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
      ListEmptyComponent={
        <Text className="mt-10 text-center text-sn-slate">Aucune commande pour le moment.</Text>
      }
      renderItem={({ item }) => {
        const token = item.order_access_tokens?.[0];
        return (
          <View className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <View className="flex-row items-center justify-between">
              <Text className="font-semibold text-sn-slate">{item.order_number}</Text>
              <Text className="text-sm text-sn-teal">{STATUS_LABEL[item.status] ?? item.status}</Text>
            </View>
            <Text className="mt-1 text-sn-slate">
              {item.total_fcfa.toLocaleString('fr-FR')} F CFA
            </Text>
            {item.status === 'payee' && token && !token.used_at && (
              <View className="mt-3">
                <PrimaryButton
                  title="Voir mes photos"
                  onPress={() =>
                    router.push({ pathname: '/access/[token]', params: { token: token.token } })
                  }
                />
              </View>
            )}
            {item.status === 'payee' && token?.used_at && (
              <Text className="mt-2 text-xs text-gray-400">
                Lien déjà consulté — voir l'onglet Téléchargements.
              </Text>
            )}
          </View>
        );
      }}
    />
  );
}
