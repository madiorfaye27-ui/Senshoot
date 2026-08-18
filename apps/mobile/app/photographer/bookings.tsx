import type { BookingRequest } from '@shootsenegal/shared';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

const STATUS_LABEL: Record<string, string> = {
  en_attente: 'En attente',
  contactee: 'Contactée',
  confirmee: 'Confirmée',
  refusee: 'Refusée',
};

export default function Bookings() {
  const { profile } = useAuth();
  const [bookings, setBookings] = useState<BookingRequest[] | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: photographer } = await supabase
      .from('photographers')
      .select('id')
      .eq('profile_id', profile.id)
      .single();
    if (!photographer) return setBookings([]);

    const { data } = await supabase
      .from('booking_requests')
      .select('*')
      .eq('photographer_id', photographer.id)
      .order('event_date', { ascending: true });
    setBookings(data ?? []);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  const setStatus = async (id: string, status: 'contactee' | 'confirmee' | 'refusee') => {
    setUpdatingId(id);
    setErrorId(null);
    try {
      await apiFetch(`/api/photographers/booking-requests/${id}/status`, {
        method: 'POST',
        body: JSON.stringify({ status }),
      });
      await load();
    } catch {
      setErrorId(id);
    } finally {
      setUpdatingId(null);
    }
  };

  if (bookings === null) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white">
        <ActivityIndicator color="#ff8e00" />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-sn-white"
      data={bookings}
      keyExtractor={(b) => b.id}
      contentContainerStyle={{ padding: 16, gap: 12 }}
      ListHeaderComponent={<Text className="mb-2 text-2xl font-bold text-sn-slate">Réservations</Text>}
      ListEmptyComponent={<Text className="text-center text-sn-slate">Aucune demande pour le moment.</Text>}
      renderItem={({ item }) => (
        <View className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <Text className="font-semibold text-sn-slate">
            {item.client_name} — {item.event_date}
          </Text>
          <Text className="mt-1 text-xs text-gray-500">
            {item.client_email}
            {item.client_whatsapp ? ` · ${item.client_whatsapp}` : ''}
          </Text>
          {item.message ? <Text className="mt-1 text-xs italic text-gray-400">« {item.message} »</Text> : null}
          <Text className="mt-2 text-xs font-medium text-sn-teal">{STATUS_LABEL[item.status]}</Text>
          {errorId === item.id ? <Text className="mt-1 text-xs text-sn-orange">Échec de la mise à jour</Text> : null}

          {item.client_whatsapp && (
            <View className="mt-3">
              <PrimaryButton
                title="Contacter via WhatsApp"
                variant="outline"
                onPress={() => {
                  const digits = item.client_whatsapp!.replace(/\D/g, '');
                  Linking.openURL(`https://wa.me/${digits}`);
                }}
              />
            </View>
          )}

          {(item.status === 'en_attente' || item.status === 'contactee') && (
            <View className="mt-3 flex-row flex-wrap gap-2">
              {item.status === 'en_attente' && (
                <PrimaryButton
                  title="Marquer contacté"
                  onPress={() => setStatus(item.id, 'contactee')}
                  loading={updatingId === item.id}
                  variant="outline"
                />
              )}
              <PrimaryButton
                title="Confirmer"
                onPress={() => setStatus(item.id, 'confirmee')}
                loading={updatingId === item.id}
              />
              <PrimaryButton
                title="Refuser"
                onPress={() => setStatus(item.id, 'refusee')}
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
