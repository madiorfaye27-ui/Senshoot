import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QueryState } from '@/components/QueryState';
import { apiFetch } from '@/lib/api';
import { useAdminOverview } from '@/lib/admin';

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  validated: 'Validé',
  rejected: 'Rejeté',
  suspended: 'Suspendu',
};

export default function AdminPhotographers() {
  const { data, isLoading, refetch } = useAdminOverview();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const setStatus = async (id: string, status: 'validated' | 'rejected' | 'suspended') => {
    setUpdatingId(id);
    try {
      await apiFetch(`/api/admin/photographers/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      await queryClient.invalidateQueries({ queryKey: ['admin-overview'] });
    } catch {
      // Erreur silencieuse : le statut reste inchangé à l'écran, l'admin peut réessayer.
    } finally {
      setUpdatingId(null);
    }
  };

  if (isLoading || !data) {
    return <QueryState isLoading={isLoading} onRetry={refetch} />;
  }

  return (
    <FlatList
      className="flex-1 bg-sn-white"
      data={data.photographers}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      ListHeaderComponent={<Text className="mb-2 text-2xl font-bold text-sn-slate">Photographes</Text>}
      ListEmptyComponent={<Text className="text-center text-sn-slate">Aucun photographe.</Text>}
      renderItem={({ item }) => (
        <View className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="flex-1 font-semibold text-sn-slate">
              {item.studio_name || `${item.profiles?.first_name ?? ''} ${item.profiles?.last_name ?? ''}`.trim()}
            </Text>
            <Text className="text-xs font-medium text-sn-teal">{STATUS_LABEL[item.status]}</Text>
          </View>
          <Text className="mt-1 text-xs text-gray-500">
            {item.profiles?.first_name} {item.profiles?.last_name} · {item.profiles?.phone || 'Pas de téléphone'}
          </Text>

          <View className="mt-3 flex-row flex-wrap gap-2">
            {(item.status === 'pending' || item.status === 'rejected') && (
              <PrimaryButton
                title="Valider"
                onPress={() => setStatus(item.id, 'validated')}
                loading={updatingId === item.id}
              />
            )}
            {item.status === 'pending' && (
              <PrimaryButton
                title="Rejeter"
                onPress={() => setStatus(item.id, 'rejected')}
                loading={updatingId === item.id}
                variant="outline"
              />
            )}
            {item.status === 'validated' && (
              <PrimaryButton
                title="Suspendre"
                onPress={() => setStatus(item.id, 'suspended')}
                loading={updatingId === item.id}
                variant="outline"
              />
            )}
            {item.status === 'suspended' && (
              <PrimaryButton
                title="Réactiver"
                onPress={() => setStatus(item.id, 'validated')}
                loading={updatingId === item.id}
              />
            )}
          </View>
        </View>
      )}
    />
  );
}
