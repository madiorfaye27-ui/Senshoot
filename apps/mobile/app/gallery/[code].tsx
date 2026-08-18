import { computeOrderPricing, type Photo } from '@shootsenegal/shared';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, Text, View } from 'react-native';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/lib/auth';
import { createOrder, openStripeCheckout } from '@/lib/checkout';
import { fetchEventByShortCode, type EventWithGallery } from '@/lib/gallery';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function formatFCFA(amount: number) {
  return `${amount.toLocaleString('fr-FR')} F CFA`;
}

export default function GalleryScreen() {
  const { code } = useLocalSearchParams<{ code: string }>();
  const router = useRouter();
  const { session } = useAuth();
  const isLoggedIn = !!session;

  const [event, setEvent] = useState<EventWithGallery | null | undefined>(undefined);
  const [selected, setSelected] = useState<string[]>([]);
  const [guestEmail, setGuestEmail] = useState('');
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) return;
    fetchEventByShortCode(code).then(setEvent);
  }, [code]);

  const photos: Photo[] = event?.galleries?.[0]?.photos ?? [];
  const selectedPhotos = photos.filter((p) => selected.includes(p.id));
  const fullPriceTotal = selectedPhotos.reduce((sum, p) => sum + p.price_fcfa, 0);
  const { total_fcfa: total, discountApplied } = useMemo(
    () => computeOrderPricing(selectedPhotos),
    [selectedPhotos]
  );
  const emailValid = isLoggedIn || EMAIL_RE.test(guestEmail.trim());

  const toggle = (id: string) =>
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const checkout = async (paymentMethod: 'stripe' | 'kkiapay') => {
    if (!event) return;
    setError(null);
    setPaying(true);
    try {
      const data = await createOrder({
        eventId: event.id,
        photoIds: selected,
        paymentMethod,
        guestEmail: isLoggedIn ? undefined : guestEmail.trim(),
      });

      if (paymentMethod === 'stripe' && data.checkout_url) {
        const result = await openStripeCheckout(data.checkout_url);
        if (!result.canceled) {
          router.replace(isLoggedIn ? '/client/orders' : '/');
        }
      } else if (paymentMethod === 'kkiapay' && data.order_id && data.amount) {
        router.push({
          pathname: '/checkout/kkiapay',
          params: { kind: 'order', id: data.order_id, amount: String(data.amount) },
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setPaying(false);
    }
  };

  if (event === undefined) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white">
        <ActivityIndicator color="#ff8e00" />
      </View>
    );
  }

  if (event === null) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white px-6">
        <Text className="text-center text-sn-slate">Galerie introuvable pour ce code.</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-sn-white">
      <View className="px-4 pt-6">
        <Text className="text-xl font-bold text-sn-slate">{event.name}</Text>
        {event.city ? <Text className="text-sn-slate">{event.city}</Text> : null}
      </View>

      <FlatList
        data={photos}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={{ gap: 12 }}
        contentContainerStyle={{ gap: 12, padding: 16, paddingBottom: selected.length ? 180 : 24 }}
        renderItem={({ item }) => {
          const isSelected = selected.includes(item.id);
          return (
            <Pressable
              onPress={() => toggle(item.id)}
              className={`flex-1 overflow-hidden rounded-xl bg-white shadow-sm ring-2 ${
                isSelected ? 'ring-sn-orange' : 'ring-transparent'
              }`}
            >
              <Image
                source={{ uri: item.watermark_url || item.thumbnail_url || undefined }}
                style={{ aspectRatio: 1, width: '100%' }}
                contentFit="cover"
              />
              <View className="flex-row items-center justify-between p-2">
                <Text className="text-xs text-gray-400">#{item.photo_number}</Text>
                <Text className="text-xs font-semibold text-sn-teal">
                  {formatFCFA(item.price_fcfa)}
                </Text>
              </View>
            </Pressable>
          );
        }}
        ListEmptyComponent={
          <Text className="mt-10 text-center text-sn-slate">Aucune photo pour le moment.</Text>
        }
      />

      {selected.length > 0 && (
        <View className="absolute inset-x-0 bottom-0 border-t border-gray-100 bg-white px-4 pb-8 pt-4 shadow-lg">
          <View className="mb-2 flex-row items-baseline gap-2">
            <Text className="text-sn-slate">{selected.length} photo(s) —</Text>
            {discountApplied && (
              <Text className="text-xs text-gray-400 line-through">{formatFCFA(fullPriceTotal)}</Text>
            )}
            <Text className="font-bold text-sn-teal">{formatFCFA(total)}</Text>
            {discountApplied && <Text className="text-xs font-medium text-sn-orange">-10%</Text>}
          </View>

          {!isLoggedIn && (
            <FormInput
              label="Votre email (pour recevoir le lien d'accès)"
              value={guestEmail}
              onChangeText={setGuestEmail}
              keyboardType="email-address"
            />
          )}
          {error ? <Text className="mb-2 text-sn-orange">{error}</Text> : null}

          <View className="flex-row gap-2">
            <View className="flex-1">
              <PrimaryButton
                title="Wave / Orange Money"
                onPress={() => checkout('kkiapay')}
                loading={paying}
                disabled={!emailValid}
                variant="outline"
              />
            </View>
            <View className="flex-1">
              <PrimaryButton
                title="Carte bancaire"
                onPress={() => checkout('stripe')}
                loading={paying}
                disabled={!emailValid}
              />
            </View>
          </View>
        </View>
      )}
    </View>
  );
}
