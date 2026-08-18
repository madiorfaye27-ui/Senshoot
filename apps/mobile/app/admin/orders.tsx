import { FlatList, Text, View } from 'react-native';
import { QueryState } from '@/components/QueryState';
import { useAdminOverview } from '@/lib/admin';

function formatFCFA(amount: number) {
  return `${amount.toLocaleString('fr-FR')} F CFA`;
}

export default function AdminOrders() {
  const { data, isLoading, refetch } = useAdminOverview();

  if (isLoading || !data) {
    return <QueryState isLoading={isLoading} onRetry={refetch} />;
  }

  return (
    <FlatList
      className="flex-1 bg-sn-white"
      data={data.orders}
      keyExtractor={(o) => o.id}
      contentContainerStyle={{ padding: 16, gap: 8 }}
      ListHeaderComponent={<Text className="mb-2 text-2xl font-bold text-sn-slate">Commandes</Text>}
      ListEmptyComponent={<Text className="text-center text-sn-slate">Aucune commande.</Text>}
      renderItem={({ item }) => (
        <View className="rounded-lg border border-gray-100 bg-white p-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-mono text-xs text-gray-500">{item.order_number}</Text>
            <Text className="font-semibold text-sn-teal">{formatFCFA(item.total_fcfa)}</Text>
          </View>
          <Text className="mt-1 text-xs text-sn-slate">
            {item.profiles ? `${item.profiles.first_name} ${item.profiles.last_name}` : item.guest_email}
            {' · '}
            {item.photographers?.studio_name ?? '—'}
          </Text>
          <Text className="mt-1 text-xs capitalize text-gray-400">
            {item.payment_method} · {item.status}
          </Text>
        </View>
      )}
    />
  );
}
