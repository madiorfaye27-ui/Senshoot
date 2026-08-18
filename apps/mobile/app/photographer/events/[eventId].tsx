import type { Event, EventClientLink, Gallery, Photo } from '@shootsenegal/shared';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Share,
  Text,
  TextInput,
  View,
} from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';

const ORIGINALS_BUCKET = 'photos-originals';
const APP_URL = process.env.EXPO_PUBLIC_APP_URL;

type EventDetail = Event & {
  galleries: (Gallery & { photos: Photo[] })[];
  event_client_links: EventClientLink[];
};

export default function EventDetail() {
  const { eventId } = useLocalSearchParams<{ eventId: string }>();
  const [event, setEvent] = useState<EventDetail | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({ done: 0, total: 0 });
  const [generatingLink, setGeneratingLink] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!eventId) return;
    const { data } = await supabase
      .from('events')
      .select('*, galleries(*, photos(*)), event_client_links(*)')
      .eq('id', eventId)
      .single();
    setEvent(data as EventDetail);
  }, [eventId]);

  useEffect(() => {
    load();
  }, [load]);

  const gallery = event?.galleries?.[0];

  const pickAndUpload = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      quality: 1,
    });
    if (result.canceled || !gallery) return;

    setUploading(true);
    setUploadProgress({ done: 0, total: result.assets.length });

    for (let i = 0; i < result.assets.length; i++) {
      const asset = result.assets[i];
      const ext = asset.uri.split('.').pop() || 'jpg';
      const path = `${gallery.id}/${Date.now()}-${i}.${ext}`;

      try {
        const response = await fetch(asset.uri);
        const blob = await response.blob();
        const { error: uploadError } = await supabase.storage
          .from(ORIGINALS_BUCKET)
          .upload(path, blob, { contentType: asset.mimeType ?? 'image/jpeg' });
        if (uploadError) throw uploadError;

        await apiFetch('/api/photos', {
          method: 'POST',
          body: JSON.stringify({
            gallery_id: gallery.id,
            photo_number: String((gallery.photos?.length ?? 0) + i + 1).padStart(4, '0'),
            original_path: path,
            price_fcfa: 2000,
          }),
        });
      } catch {
        // Erreur pour cette photo — on continue avec les suivantes, comme
        // le fait le PhotoUploader web (une erreur n'interrompt pas le lot).
      }
      setUploadProgress((p) => ({ ...p, done: p.done + 1 }));
    }

    setUploading(false);
    load();
  };

  const generateClientLink = async () => {
    setGeneratingLink(true);
    setLinkError(null);
    try {
      const data = await apiFetch(`/api/events/${eventId}/client-links`, { method: 'POST' });
      const url = `${APP_URL}/api/invite/${data.token}`;
      await Share.share({ message: url });
      load();
    } catch (err) {
      setLinkError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setGeneratingLink(false);
    }
  };

  if (!event) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white">
        <ActivityIndicator color="#ff8e00" />
      </View>
    );
  }

  return (
    <FlatList
      className="flex-1 bg-sn-white"
      data={gallery?.photos ?? []}
      keyExtractor={(p) => p.id}
      numColumns={3}
      columnWrapperStyle={{ gap: 8 }}
      contentContainerStyle={{ padding: 16, gap: 8 }}
      ListHeaderComponent={
        <View className="mb-4">
          <Text className="text-xl font-bold text-sn-slate">{event.name}</Text>
          <Text className="mt-1 text-sm text-gray-500">
            {event.category} · {event.status}
            {event.city ? ` · ${event.city}` : ''}
          </Text>

          {event.qr_code_url && (
            <View className="mt-4 flex-row items-center gap-4 rounded-xl border border-gray-100 p-4">
              <Image source={{ uri: event.qr_code_url }} style={{ width: 80, height: 80 }} />
              <View className="flex-1">
                <Text className="text-sm font-medium text-sn-slate">QR Code public</Text>
                <Text className="text-xs text-gray-500">Code : {event.qr_short_code}</Text>
              </View>
            </View>
          )}

          <View className="mt-6">
            <Text className="mb-2 text-lg font-semibold text-sn-slate">
              Photos ({gallery?.photos?.length ?? 0})
            </Text>
            <PrimaryButton
              title={uploading ? `Envoi ${uploadProgress.done}/${uploadProgress.total}…` : 'Ajouter des photos'}
              onPress={pickAndUpload}
              loading={uploading}
            />
          </View>
        </View>
      }
      renderItem={({ item }) => <PhotoTile photo={item} onPriceChanged={load} />}
      ListFooterComponent={
        <View className="mt-8 border-t border-gray-100 pt-6">
          <Text className="text-lg font-semibold text-sn-slate">Liens clients sur place</Text>
          <Text className="mt-1 text-sm text-gray-500">
            Génère un lien/QR à usage unique pour emmener un client directement vers cette galerie.
          </Text>
          <View className="mt-3">
            <PrimaryButton title="Générer un lien" onPress={generateClientLink} loading={generatingLink} />
          </View>
          {linkError ? <Text className="mt-2 text-xs text-sn-orange">{linkError}</Text> : null}
          <Text className="mt-4 text-xs text-gray-400">
            {(event.event_client_links ?? []).filter((l) => !l.used_at).length} lien(s) disponible(s),{' '}
            {(event.event_client_links ?? []).filter((l) => l.used_at).length} déjà utilisé(s).
          </Text>
        </View>
      }
    />
  );
}

function PhotoTile({ photo, onPriceChanged }: { photo: Photo; onPriceChanged: () => void }) {
  const [editing, setEditing] = useState(false);
  const [price, setPrice] = useState(String(photo.price_fcfa));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/api/photos/${photo.id}/price`, {
        method: 'POST',
        body: JSON.stringify({ price_fcfa: Number(price) }),
      });
      setEditing(false);
      onPriceChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Échec');
      setPrice(String(photo.price_fcfa));
    } finally {
      setSaving(false);
    }
  };

  return (
    <View className="flex-1 overflow-hidden rounded-lg border border-gray-100">
      <Image
        source={{ uri: photo.thumbnail_url || undefined }}
        style={{ aspectRatio: 1, width: '100%' }}
        contentFit="cover"
      />
      {error ? <Text className="px-1.5 text-[9px] text-sn-orange">{error}</Text> : null}
      <View className="flex-row items-center justify-between gap-1 p-1.5">
        <Text className="text-[10px] text-gray-400">#{photo.photo_number}</Text>
        {editing ? (
          <TextInput
            value={price}
            onChangeText={setPrice}
            onBlur={save}
            keyboardType="numeric"
            autoFocus
            className="w-14 rounded border border-gray-200 px-1 text-[10px]"
            editable={!saving}
          />
        ) : (
          <Text onPress={() => setEditing(true)} className="text-[10px] font-semibold text-sn-teal">
            {photo.price_fcfa} F
          </Text>
        )}
      </View>
    </View>
  );
}
