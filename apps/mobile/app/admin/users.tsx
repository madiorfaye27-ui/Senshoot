import { FlatList, Text, View } from 'react-native';
import { QueryState } from '@/components/QueryState';
import { useAdminOverview } from '@/lib/admin';

const ROLE_LABEL: Record<string, string> = {
  client: 'Client',
  photographer: 'Photographe',
  admin: 'Admin',
};

export default function AdminUsers() {
  const { data, isLoading, refetch } = useAdminOverview();

  if (isLoading || !data) {
    return <QueryState isLoading={isLoading} onRetry={refetch} />;
  }

  return (
    <FlatList
      className="flex-1 bg-sn-white"
      data={data.users}
      keyExtractor={(u) => u.id}
      contentContainerStyle={{ padding: 16, gap: 8 }}
      ListHeaderComponent={<Text className="mb-2 text-2xl font-bold text-sn-slate">Utilisateurs</Text>}
      ListEmptyComponent={<Text className="text-center text-sn-slate">Aucun utilisateur.</Text>}
      renderItem={({ item }) => (
        <View className="rounded-lg border border-gray-100 bg-white p-3">
          <View className="flex-row items-center justify-between">
            <Text className="font-medium text-sn-slate">
              {item.first_name} {item.last_name}
            </Text>
            <Text className="text-xs font-medium text-sn-teal">{ROLE_LABEL[item.role] ?? item.role}</Text>
          </View>
          <Text className="mt-1 text-xs text-gray-500">{item.email ?? '—'}</Text>
        </View>
      )}
    />
  );
}
