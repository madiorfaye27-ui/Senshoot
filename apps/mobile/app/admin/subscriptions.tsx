import { FlatList, Text, View } from 'react-native';
import { QueryState } from '@/components/QueryState';
import { useAdminOverview } from '@/lib/admin';

function formatFCFA(amount: number) {
  return `${amount.toLocaleString('fr-FR')} F CFA`;
}

export default function AdminSubscriptions() {
  const { data, isLoading, refetch } = useAdminOverview();

  if (isLoading || !data) {
    return <QueryState isLoading={isLoading} onRetry={refetch} />;
  }

  return (
    <FlatList
      className="flex-1 bg-sn-white"
      data={data.subscriptions}
      keyExtractor={(s) => s.id}
      contentContainerStyle={{ padding: 16, gap: 8 }}
      ListHeaderComponent={<Text className="mb-2 text-2xl font-bold text-sn-slate">Abonnements</Text>}
      ListEmptyComponent={<Text className="text-center text-sn-slate">Aucun abonnement.</Text>}
      renderItem={({ item }) => (
        <View className="rounded-lg border border-gray-100 bg-white p-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-sn-slate">
              {item.photographers?.studio_name || item.photographers?.slug}
            </Text>
            <Text className="text-xs font-medium text-sn-teal">{item.status}</Text>
          </View>
          <Text className="mt-1 text-xs text-gray-500">
            {item.plans?.name} · {item.plans ? formatFCFA(item.plans.price_fcfa) : ''}/mois
          </Text>
        </View>
      )}
    />
  );
}
