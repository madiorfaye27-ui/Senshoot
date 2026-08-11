import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// Consomme un lien client à usage unique généré par le photographe sur
// place, puis redirige vers la galerie de l'événement (sélection des
// photos + paiement, flux inchangé). Le lien ne fonctionne qu'une fois ;
// ceci n'a aucun effet sur le QR public de l'événement, qui reste
// réutilisable par tous les invités.
export async function GET(
  request: NextRequest,
  { params }: { params: { token: string } }
) {
  const admin = createAdminClient();

  const { data: link } = await admin
    .from('event_client_links')
    .select('*, events(qr_short_code)')
    .eq('token', params.token)
    .single();

  if (!link || link.used_at) {
    return NextResponse.redirect(
      new URL('/galeries?error=' + encodeURIComponent('Ce lien a déjà été utilisé ou est invalide.'), request.url)
    );
  }

  await admin
    .from('event_client_links')
    .update({ used_at: new Date().toISOString() })
    .eq('id', link.id);

  return NextResponse.redirect(new URL(`/galerie/${link.events.qr_short_code}`, request.url));
}
