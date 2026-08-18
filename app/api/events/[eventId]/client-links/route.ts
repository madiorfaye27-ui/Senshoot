import { NextRequest, NextResponse } from 'next/server';
import { resolveRequestUser, isAuthorizedOrigin } from '@/lib/auth/resolveRequestUser';

// Génère un lien/QR individuel à usage unique pour un client présent sur
// place (voir supabase/migrations/0008_access_tokens.sql). L'appartenance
// de l'événement au photographe connecté est garantie par la policy RLS
// "Un photographe peut créer des liens clients pour ses événements" — on
// utilise ici le client lié à SA session, pas le client admin.
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { supabase, isBearer } = await resolveRequestUser(request);

  if (!isAuthorizedOrigin(request, isBearer)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const token = crypto.randomUUID();
  const { error } = await supabase.from('event_client_links').insert({
    event_id: params.eventId,
    token,
  });

  if (error) {
    if (isBearer) return NextResponse.json({ error: 'Création impossible' }, { status: 400 });
    return NextResponse.redirect(
      new URL(`/dashboard/evenements/${params.eventId}?error=${encodeURIComponent('Création impossible')}`, request.url)
    );
  }

  if (isBearer) return NextResponse.json({ token });
  return NextResponse.redirect(new URL(`/dashboard/evenements/${params.eventId}`, request.url));
}
