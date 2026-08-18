import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser';

const ORIGINALS_BUCKET = 'photos-originals';
const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes

// Génère une URL signée temporaire vers l'original en PLEINE QUALITÉ,
// uniquement si :
//  1. L'utilisateur est authentifié
//  2. La photo appartient à une commande PAYÉE lui appartenant
// Sans ces conditions, seule la version filigranée (bucket public) reste
// accessible. Voir cahier des charges section 8 : « vérifier les droits
// et enregistrer le téléchargement ».
export async function GET(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
  const { supabase, user, isBearer } = await resolveRequestUser(request);

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Limite le nombre de liens de téléchargement générés par utilisateur
  const rate = checkRateLimit(request, `downloads:${user.id}`, 60, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez plus tard.' }, { status: 429 });
  }

  const { data: item } = await supabase
    .from('order_items')
    .select('*, photos(original_url), orders!inner(client_id, status)')
    .eq('id', params.itemId)
    .single();

  if (!item || item.orders.client_id !== user.id || item.orders.status !== 'payee') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: signed, error } = await admin.storage
    .from(ORIGINALS_BUCKET)
    .createSignedUrl(item.photos.original_url, SIGNED_URL_TTL_SECONDS, { download: true });

  if (error || !signed) {
    return NextResponse.json({ error: error?.message || 'Erreur de génération du lien' }, { status: 500 });
  }

  // Enregistre le téléchargement (traçabilité) — via le client admin,
  // car les utilisateurs n'ont pas de droit d'UPDATE direct sur
  // order_items (voir migration 0004_rls_policies.sql).
  await admin
    .from('order_items')
    .update({ downloaded: true, downloaded_at: new Date().toISOString() })
    .eq('id', params.itemId);

  // A redirect is fine for a browser tab, but the mobile app can't do much
  // with a 302 — it needs the URL itself to hand to Linking.openURL / a
  // download manager.
  if (isBearer) {
    return NextResponse.json({ download_url: signed.signedUrl });
  }
  return NextResponse.redirect(signed.signedUrl);
}
