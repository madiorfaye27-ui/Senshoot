import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isSameOriginRequest } from '@/lib/utils/csrf';

const priceSchema = z.object({
  price_fcfa: z.number().int().min(500).max(1_000_000),
});

// Aucune policy RLS UPDATE sur "photos" (migration 0004 ne couvre que
// SELECT/INSERT) : l'appartenance est donc vérifiée ici via le client
// RLS-scoped (qui ne renverra la photo que si elle appartient à une
// galerie du photographe connecté — même policy SELECT que la lecture),
// puis l'écriture passe par le client admin, même schéma que les autres
// routes sensibles de ce projet.
export async function POST(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = priceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Prix invalide (500 F CFA minimum)' }, { status: 400 });
  }

  const { data: photo } = await supabase
    .from('photos')
    .select('id')
    .eq('id', params.photoId)
    .single();

  if (!photo) {
    return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('photos')
    .update({ price_fcfa: parsed.data.price_fcfa })
    .eq('id', params.photoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
