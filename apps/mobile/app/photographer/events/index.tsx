import type { Event } from '@shootsenegal/shared';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { FlatList, Pressable, RefreshControl, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function PhotographerEvents() {
  const { profile } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!profile) return;
    const { data: photographer } = await supabase
      .from('photographers')
      .select('id')
      .eq('profile_id', profile.id)
      .single();
    if (!photographer) return setEvents([]);

    const { data } = await supabase
      .from('events')
      .select('*')
      .eq('photographer_id', photographer.id)
      .order('created_at', { ascending: false });
    setEvents(data ?? []);
  }, [profile]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <View className="flex-1 bg-sn-white">
      <View className="flex-row items-center justify-between px-4 pt-6">
        <Text className="text-2xl font-bold text-sn-slate">Événements</Text>
      </View>
      <View className="px-4 pt-4">
        <PrimaryButton title="Nouvel événement" onPress={() => router.push('/photographer/events/new')} />
      </View>
      <FlatList
        data={events ?? []}
        keyExtractor={(e) => e.id}
        contentContainerStyle={{ padding: 16, gap: 10 }}
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
          events !== null ? (
            <Text className="mt-6 text-center text-sn-slate">Aucun événement pour le moment.</Text>
          ) : null
        }
        renderItem={({ item }) => (
          <Pressable
            onPress={() => router.push({ pathname: '/photographer/events/[eventId]', params: { eventId: item.id } })}
            className="flex-row items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <View>
              <Text className="font-semibold text-sn-slate">{item.name}</Text>
              <Text className="text-xs text-gray-500">
                {item.category} · {item.status}
              </Text>
            </View>
            <Text className="text-sm font-medium text-sn-orange">Gérer</Text>
          </Pressable>
        )}
      />
    </View>
  );
}
