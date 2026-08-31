import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveRequestUser, isAuthorizedOrigin } from '@/lib/auth/resolveRequestUser';

const ORIGINALS_BUCKET = 'photos-originals';
const PUBLIC_BUCKET = 'photos-public';

// Même schéma que app/api/photos/[photoId]/route.ts : le client RLS-scoped
// (policy "Un photographe peut voir ses propres événements", migration 0004)
// vérifie l'appartenance, puis l'écriture passe par le client admin — il
// n'existe aucune policy DELETE sur "events" côté client.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { eventId: string } }
) {
  const { supabase, user, isBearer } = await resolveRequestUser(request);

  if (!isAuthorizedOrigin(request, isBearer)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: event } = await supabase
    .from('events')
    .select('id')
    .eq('id', params.eventId)
    .single();

  if (!event) {
    return NextResponse.json({ error: 'Événement introuvable' }, { status: 404 });
  }

  const admin = createAdminClient();

  // Un événement avec au moins une commande ne doit jamais disparaître —
  // même logique que pour une photo déjà achetée. orders.event_id n'a pas
  // de ON DELETE CASCADE (migration 0001) : Postgres bloquerait de toute
  // façon la suppression, mais on vérifie d'abord pour un message clair.
  const { count } = await admin
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('event_id', params.eventId);

  if (count && count > 0) {
    return NextResponse.json(
      { error: 'Cet événement a des commandes associées et ne peut plus être supprimé.' },
      { status: 409 }
    );
  }

  // La suppression en base (cascade events -> galleries -> photos, voir
  // migration 0001) ne nettoie pas les fichiers Storage physiques : on
  // récupère d'abord tous les chemins pour les supprimer explicitement.
  const { data: galleries } = await admin
    .from('galleries')
    .select('photos(original_url)')
    .eq('event_id', params.eventId);

  const originalPaths: string[] = [];
  const publicPaths: string[] = [];
  for (const gallery of galleries ?? []) {
    for (const photo of (gallery as any).photos ?? []) {
      if (!photo.original_url) continue;
      originalPaths.push(photo.original_url);
      const basePath = photo.original_url.replace(/\.[^/.]+$/, '');
      publicPaths.push(`${basePath}-web.jpg`, `${basePath}-thumb.jpg`);
    }
  }

  if (originalPaths.length) {
    await Promise.all([
      admin.storage.from(ORIGINALS_BUCKET).remove(originalPaths),
      admin.storage.from(PUBLIC_BUCKET).remove(publicPaths),
    ]);
  }

  const { error } = await admin.from('events').delete().eq('id', params.eventId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (isBearer) return NextResponse.json({ success: true });
  return NextResponse.redirect(new URL('/dashboard/evenements', request.url));
}
