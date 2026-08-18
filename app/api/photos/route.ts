import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { processPhoto } from '@/lib/utils/watermark';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { resolveRequestUser, isAuthorizedOrigin } from '@/lib/auth/resolveRequestUser';

const ORIGINALS_BUCKET = 'photos-originals'; // bucket privé
const PUBLIC_BUCKET = 'photos-public';       // bucket public (filigrané uniquement)

const photoSchema = z.object({
  gallery_id: z.string().uuid(),
  photo_number: z.string().trim().max(20).optional().default(''),
  original_path: z.string().min(1).max(500),
  price_fcfa: z.number().int().min(500).max(1_000_000).optional(),
});

// Traite une photo dont l'original a déjà été uploadé par le photographe
// dans le bucket PRIVÉ "photos-originals" (voir PhotoUploader.tsx).
// Cette route :
//  1. Vérifie que l'appelant est bien propriétaire de la galerie ET que
//     le chemin fourni correspond bien à CETTE galerie (empêche un
//     utilisateur authentifié de faire traiter/exfiltrer un fichier privé
//     appartenant à un autre photographe en devinant/forgeant un chemin)
//  2. Télécharge l'original depuis le bucket privé (via le client admin)
//  3. Génère les versions filigranées (web + miniature) avec sharp
//  4. Upload UNIQUEMENT ces versions filigranées dans le bucket public
//  5. Enregistre les métadonnées en base
// L'original n'est jamais copié dans le bucket public : seul le client
// admin (service_role) peut le lire, ce qui empêche tout téléchargement
// en pleine qualité avant paiement confirmé.
export async function POST(request: NextRequest) {
  const { supabase, user, isBearer } = await resolveRequestUser(request);

  if (!isAuthorizedOrigin(request, isBearer)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  // Limite le nombre de photos traitées par minute et par utilisateur
  // (le traitement d'image est coûteux en ressources serveur).
  const rate = checkRateLimit(request, `photos:${user.id}`, 120, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez plus tard.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = photoSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }
  const { gallery_id, photo_number, original_path, price_fcfa } = parsed.data;

  // Vérifie que la galerie appartient bien au photographe connecté
  const { data: gallery } = await supabase
    .from('galleries')
    .select('id, events!inner(photographer_id, photographers!inner(profile_id))')
    .eq('id', gallery_id)
    .single();

  const ownerProfileId = (gallery as any)?.events?.photographers?.profile_id;
  if (!gallery || ownerProfileId !== user.id) {
    return NextResponse.json({ error: 'Galerie introuvable ou accès refusé' }, { status: 403 });
  }

  // Le chemin de l'original doit être préfixé par l'ID de CETTE galerie
  // (c'est la convention utilisée par PhotoUploader.tsx) — empêche de
  // faire traiter un fichier appartenant à une autre galerie/photographe.
  if (!original_path.startsWith(`${gallery_id}/`)) {
    return NextResponse.json({ error: 'Chemin de fichier invalide' }, { status: 403 });
  }

  const admin = createAdminClient();

  // 1. Télécharger l'original depuis le bucket privé
  const { data: originalFile, error: downloadError } = await admin.storage
    .from(ORIGINALS_BUCKET)
    .download(original_path);

  if (downloadError || !originalFile) {
    return NextResponse.json(
      { error: `Impossible de lire l'original : ${downloadError?.message}` },
      { status: 400 }
    );
  }

  const originalBuffer = Buffer.from(await originalFile.arrayBuffer());

  // 2. Générer les versions filigranées
  let processed;
  try {
    processed = await processPhoto(originalBuffer);
  } catch (err: any) {
    return NextResponse.json({ error: `Traitement image échoué : ${err.message}` }, { status: 500 });
  }

  // 3. Upload des versions filigranées dans le bucket PUBLIC uniquement
  const basePath = original_path.replace(/\.[^/.]+$/, '');

  const [webUpload, thumbUpload] = await Promise.all([
    admin.storage
      .from(PUBLIC_BUCKET)
      .upload(`${basePath}-web.jpg`, processed.web, { contentType: 'image/jpeg', upsert: true }),
    admin.storage
      .from(PUBLIC_BUCKET)
      .upload(`${basePath}-thumb.jpg`, processed.thumbnail, { contentType: 'image/jpeg', upsert: true }),
  ]);

  if (webUpload.error || thumbUpload.error) {
    return NextResponse.json(
      { error: webUpload.error?.message || thumbUpload.error?.message },
      { status: 400 }
    );
  }

  const webUrl = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(`${basePath}-web.jpg`).data.publicUrl;
  const thumbUrl = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(`${basePath}-thumb.jpg`).data.publicUrl;

  // 4. Enregistrement en base — original_url stocke seulement le CHEMIN
  // privé (jamais une URL publique) ; il servira à générer une URL signée
  // temporaire au moment du téléchargement après paiement.
  const { data: photo, error } = await supabase
    .from('photos')
    .insert({
      gallery_id,
      photo_number,
      original_url: original_path,
      web_url: webUrl,
      thumbnail_url: thumbUrl,
      watermark_url: webUrl,
      price_fcfa: price_fcfa ?? 2000,
      width: processed.width,
      height: processed.height,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ photo });
}
