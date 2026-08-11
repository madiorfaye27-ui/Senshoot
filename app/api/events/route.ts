import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isSameOriginRequest } from '@/lib/utils/csrf';
import QRCode from 'qrcode';

const EVENT_CATEGORIES = [
  'mariage', 'bapteme', 'anniversaire', 'conference', 'concert', 'festival',
  'sport', 'professionnel', 'remise_diplomes', 'scolaire', 'institutionnel',
  'shooting', 'autre',
] as const;

const eventSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional().default(''),
  event_date: z.string().optional().nullable(),
  city: z.string().trim().max(120).optional().default(''),
  category: z.enum(EVENT_CATEGORIES).default('autre'),
});

// Génère un code court aléatoire pour l'URL publique du QR Code
function generateShortCode(length = 8) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  return Array.from({ length }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const formData = await request.formData();
  const supabase = createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const parsed = eventSchema.safeParse({
    name: formData.get('name'),
    description: formData.get('description'),
    event_date: formData.get('event_date') || undefined,
    city: formData.get('city'),
    category: formData.get('category'),
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      new URL(`/dashboard/evenements/nouveau?error=${encodeURIComponent('Formulaire invalide')}`, request.url)
    );
  }

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!photographer) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  const qr_short_code = generateShortCode();

  const { data: event, error } = await supabase
    .from('events')
    .insert({
      photographer_id: photographer.id,
      name: parsed.data.name,
      description: parsed.data.description,
      event_date: parsed.data.event_date || null,
      city: parsed.data.city,
      category: parsed.data.category,
      status: 'publie',
      visibility: 'public',
      qr_short_code,
    })
    .select()
    .single();

  if (error || !event) {
    return NextResponse.redirect(
      new URL(`/dashboard/evenements/nouveau?error=${encodeURIComponent('Création impossible')}`, request.url)
    );
  }

  // Génère le QR Code pointant vers la galerie publique /galerie/[shortCode]
  const galleryUrl = `${process.env.NEXT_PUBLIC_APP_URL}/galerie/${qr_short_code}`;
  const qrDataUrl = await QRCode.toDataURL(galleryUrl);

  await supabase.from('events').update({ qr_code_url: qrDataUrl }).eq('id', event.id);

  // Crée automatiquement la galerie associée à l'événement
  await supabase.from('galleries').insert({
    event_id: event.id,
    name: event.name,
  });

  return NextResponse.redirect(new URL(`/dashboard/evenements/${event.id}`, request.url));
}
