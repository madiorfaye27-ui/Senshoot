import { useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FlatList, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { QueryState } from '@/components/QueryState';
import { apiFetch } from '@/lib/api';
import { useAdminOverview } from '@/lib/admin';

const STATUS_LABEL: Record<string, string> = {
  pending: 'En attente',
  completed: 'Payé',
  rejected: 'Rejeté',
};

function formatFCFA(amount: number) {
  return `${amount.toLocaleString('fr-FR')} F CFA`;
}

export default function AdminPayouts() {
  const { data, isLoading, refetch } = useAdminOverview();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const setStatus = async (id: string, status: 'completed' | 'rejected') => {
    setUpdatingId(id);
    try {
      await apiFetch(`/api/admin/payouts/${id}/status`, {
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
      data={data.payouts}
      keyExtractor={(p) => p.id}
      contentContainerStyle={{ padding: 16, gap: 10 }}
      ListHeaderComponent={<Text className="mb-2 text-2xl font-bold text-sn-slate">Retraits</Text>}
      ListEmptyComponent={<Text className="text-center text-sn-slate">Aucune demande de retrait.</Text>}
      renderItem={({ item }) => (
        <View className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <View className="flex-row items-center justify-between">
            <Text className="font-semibold text-sn-slate">
              {item.photographers?.studio_name || item.photographers?.slug}
            </Text>
            <Text className="font-bold text-sn-orange">{formatFCFA(item.amount_fcfa)}</Text>
          </View>
          <Text className="mt-1 text-xs text-gray-500">
            {item.payout_method} · {item.payout_details}
          </Text>
          <Text className="mt-1 text-xs font-medium text-sn-teal">{STATUS_LABEL[item.status]}</Text>

          {item.status === 'pending' && (
            <View className="mt-3 flex-row gap-2">
              <PrimaryButton
                title="Marquer payé"
                onPress={() => setStatus(item.id, 'completed')}
                loading={updatingId === item.id}
              />
              <PrimaryButton
                title="Rejeter"
                onPress={() => setStatus(item.id, 'rejected')}
                loading={updatingId === item.id}
                variant="outline"
              />
            </View>
          )}
        </View>
      )}
    />
  );
}
