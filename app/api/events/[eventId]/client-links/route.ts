import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isSameOriginRequest } from '@/lib/utils/csrf';

// Génère un lien/QR individuel à usage unique pour un client présent sur
// place (voir supabase/migrations/0008_access_tokens.sql). L'appartenance
// de l'événement au photographe connecté est garantie par la policy RLS
// "Un photographe peut créer des liens clients pour ses événements" — on
// utilise ici le client lié à SA session, pas le client admin.
export async function POST(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const supabase = createClient();

  const { error } = await supabase.from('event_client_links').insert({
    event_id: params.eventId,
    token: crypto.randomUUID(),
  });

  if (error) {
    return NextResponse.redirect(
      new URL(`/dashboard/evenements/${params.eventId}?error=${encodeURIComponent('Création impossible')}`, request.url)
    );
  }

  return NextResponse.redirect(new URL(`/dashboard/evenements/${params.eventId}`, request.url));
}
