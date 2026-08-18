import type { Order, OrderItem, Photo } from '@shootsenegal/shared';
import { Image } from 'expo-image';
import { Link, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Linking, Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiFetch } from '@/lib/api';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL;

type OrderWithItems = Order & { order_items: (OrderItem & { photos: Photo })[] };

export default function AccessToken() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const [state, setState] = useState<
    { status: 'loading' } | { status: 'used' } | { status: 'error' } | { status: 'ready'; order: OrderWithItems }
  >({ status: 'loading' });

  useEffect(() => {
    if (!token) return;
    apiFetch(`/api/acces/${token}`)
      .then((data) => {
        if (data.used) setState({ status: 'used' });
        else setState({ status: 'ready', order: data.order });
      })
      .catch(() => setState({ status: 'error' }));
  }, [token]);

  if (state.status === 'loading') {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white">
        <ActivityIndicator color="#ff8e00" />
      </View>
    );
  }

  if (state.status === 'used') {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white px-6">
        <Text className="mb-2 text-center text-xl font-bold text-sn-slate">
          Ce lien a déjà été utilisé
        </Text>
        <Text className="mb-6 text-center text-sn-slate">
          Retrouvez vos photos depuis votre compte.
        </Text>
        <Link href="/login" asChild>
          <PrimaryButton title="Se connecter" onPress={() => {}} />
        </Link>
      </View>
    );
  }

  if (state.status === 'error') {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white px-6">
        <Text className="text-center text-sn-slate">Lien invalide.</Text>
      </View>
    );
  }

  const { order } = state;

  return (
    <View className="flex-1 bg-sn-white px-4 pt-6">
      <Text className="mb-4 text-center text-xl font-bold text-sn-slate">
        Commande {order.order_number}
      </Text>
      <FlatList
        data={order.order_items}
        keyExtractor={(item) => item.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View className="flex-1 overflow-hidden rounded-xl bg-white shadow-sm">
            <Image
              source={{ uri: item.photos.thumbnail_url || item.photos.watermark_url || undefined }}
              style={{ aspectRatio: 1, width: '100%' }}
              contentFit="cover"
            />
            <View className="p-3">
              <Text className="mb-2 text-xs text-gray-400">#{item.photos.photo_number}</Text>
              <PrimaryButton
                title="Télécharger"
                onPress={() => Linking.openURL(`${APP_URL}/api/acces/${token}/download/${item.id}`)}
              />
            </View>
          </View>
        )}
      />
    </View>
  );
}
