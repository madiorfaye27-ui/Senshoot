import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const ORIGINALS_BUCKET = 'photos-originals';
const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes

// Téléchargement via le lien d'accès à usage unique (voir app/acces/[token]),
// sans connexion requise. Vérifie que le token existe bel et bien et que
// l'article demandé appartient à la commande liée à ce token — pas de
// dépendance à une session utilisateur ici, contrairement à
// app/api/downloads/[itemId]/route.ts (accès via le dashboard client).
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string; itemId: string } }
) {
  const rate = checkRateLimit(request, `acces-download:${params.token}`, 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez plus tard.' }, { status: 429 });
  }

  const admin = createAdminClient();

  const { data: accessToken } = await admin
    .from('order_access_tokens')
    .select('order_id')
    .eq('token', params.token)
    .single();

  if (!accessToken) {
    return NextResponse.json({ error: 'Lien invalide' }, { status: 403 });
  }

  const { data: item } = await admin
    .from('order_items')
    .select('*, photos(original_url), orders!inner(status)')
    .eq('id', params.itemId)
    .eq('order_id', accessToken.order_id)
    .single();

  if (!item || item.orders.status !== 'payee') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const { data: signed, error } = await admin.storage
    .from(ORIGINALS_BUCKET)
    .createSignedUrl(item.photos.original_url, SIGNED_URL_TTL_SECONDS, { download: true });

  if (error || !signed) {
    return NextResponse.json({ error: error?.message || 'Erreur de génération du lien' }, { status: 500 });
  }

  await admin
    .from('order_items')
    .update({ downloaded: true, downloaded_at: new Date().toISOString() })
    .eq('id', params.itemId);

  return NextResponse.redirect(signed.signedUrl);
}
