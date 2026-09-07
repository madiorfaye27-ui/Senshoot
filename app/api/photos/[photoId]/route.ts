import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveRequestUser, isAuthorizedOrigin } from '@/lib/auth/resolveRequestUser';

const ORIGINALS_BUCKET = 'photos-originals';
const PUBLIC_BUCKET = 'photos-public';

// Même schéma d'autorisation que app/api/photos/[photoId]/price/route.ts :
// le client RLS-scoped ne renvoie la photo que si elle appartient à une
// galerie du photographe connecté, puis l'écriture passe par le client admin.
export async function DELETE(
  request: NextRequest,
  { params }: { params: { photoId: string } }
) {
  const { supabase, user, isBearer } = await resolveRequestUser(request);

  if (!isAuthorizedOrigin(request, isBearer)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: photo } = await supabase
    .from('photos')
    .select('id, original_url')
    .eq('id', params.photoId)
    .single();

  if (!photo) {
    return NextResponse.json({ error: 'Photo introuvable' }, { status: 404 });
  }

  const admin = createAdminClient();

  // Une photo déjà achetée n'est jamais supprimée physiquement — le client
  // qui a payé doit garder son accès dans "Mes téléchargements"
  // (/api/downloads/[itemId] lit directement original_url, sans jamais
  // filtrer sur deleted_at). On la marque juste "supprimée" pour qu'elle
  // disparaisse de la galerie publique et des tableaux de bord.
  const { count } = await admin
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('photo_id', params.photoId);

  if (count && count > 0) {
    const { error } = await admin
      .from('photos')
      .update({ deleted_at: new Date().toISOString() })
      .eq('id', params.photoId);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ success: true, softDeleted: true });
  }

  // Jamais achetée : suppression physique, y compris les fichiers Storage.
  const basePath = photo.original_url.replace(/\.[^/.]+$/, '');

  await Promise.all([
    admin.storage.from(ORIGINALS_BUCKET).remove([photo.original_url]),
    admin.storage.from(PUBLIC_BUCKET).remove([`${basePath}-web.jpg`, `${basePath}-thumb.jpg`]),
  ]);

  const { error } = await admin.from('photos').delete().eq('id', params.photoId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ success: true });
}
