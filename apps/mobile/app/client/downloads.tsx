import type { Order, OrderItem, Photo } from '@shootsenegal/shared';
import { Image } from 'expo-image';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, RefreshControl, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

type Item = OrderItem & { photos: Photo };

export default function ClientDownloads() {
  const { session } = useAuth();
  const [items, setItems] = useState<Item[] | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!session) return;
    const { data } = await supabase
      .from('orders')
      .select('id, order_items(*, photos(*))')
      .eq('client_id', session.user.id)
      .eq('status', 'payee');
    const orders = (data as (Order & { order_items: Item[] })[]) ?? [];
    setItems(orders.flatMap((o) => o.order_items));
  }, [session]);

  useEffect(() => {
    load();
  }, [load]);

  const download = async (item: Item) => {
    setDownloadingId(item.id);
    setErrorId(null);
    try {
      const data = await apiFetch(`/api/downloads/${item.id}`);
      if (data.download_url) await Linking.openURL(data.download_url);
    } catch {
      setErrorId(item.id);
    } finally {
      setDownloadingId(null);
    }
  };

  if (items === null) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white">
        <ActivityIndicator color="#ff8e00" />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-sn-white"
      data={items}
      keyExtractor={(i) => i.id}
      numColumns={2}
      columnWrapperStyle={{ gap: 12 }}
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
        <Text className="mt-10 text-center text-sn-slate">Aucune photo téléchargeable pour le moment.</Text>
      }
      renderItem={({ item }) => (
        <View className="flex-1 overflow-hidden rounded-xl bg-white shadow-sm">
          <Image
            source={{ uri: item.photos.thumbnail_url || item.photos.watermark_url || undefined }}
            style={{ aspectRatio: 1, width: '100%' }}
            contentFit="cover"
          />
          <View className="p-2">
            <PrimaryButton
              title="Télécharger"
              onPress={() => download(item)}
              loading={downloadingId === item.id}
            />
            {errorId === item.id ? (
              <Text className="mt-1 text-center text-[10px] text-sn-orange">Échec du téléchargement</Text>
            ) : null}
          </View>
        </View>
      )}
    />
  );
}
