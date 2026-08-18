import type { Event, Gallery, Photo } from '@shootsenegal/shared';
import { supabase } from './supabase';

export type EventWithGallery = Event & { galleries: (Gallery & { photos: Photo[] })[] };

// Mirrors app/[locale]/(public)/galerie/[eventId]/page.tsx on the web —
// despite the "eventId" naming there, the lookup key is actually the
// event's qr_short_code (the short code printed on/encoded in the QR),
// not its id. Same query shape here for parity.
export async function fetchEventByShortCode(shortCode: string) {
  const { data, error } = await supabase
    .from('events')
    .select('*, galleries(*, photos(*))')
    .eq('qr_short_code', shortCode)
    .single();

  if (error || !data) return null;
  return data as unknown as EventWithGallery;
}
