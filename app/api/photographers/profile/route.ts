import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import sharp from 'sharp';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveRequestUser, isAuthorizedOrigin, parseFormOrJsonBody } from '@/lib/auth/resolveRequestUser';

const AVATAR_BUCKET = 'photographer-avatars';
const ALLOWED_LOGO_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 Mo

const profileSchema = z.object({
  studio_name: z.string().trim().max(150).optional().default(''),
  description: z.string().trim().max(1000).optional().default(''),
  city: z.string().trim().max(120).optional().default(''),
  contact_phone: z.string().trim().max(30).optional().default(''),
  contact_whatsapp: z.string().trim().max(30).optional().default(''),
  contact_email: z.union([z.literal(''), z.string().trim().email()]).optional().default(''),
});

// Met à jour la fiche publique du photographe connecté (annuaire, fiche
// /photographe/[slug]). La policy RLS "Un photographe peut modifier son
// propre profil" (migration 0004) garantit qu'il ne peut modifier QUE la
// sienne — pas besoin de vérifier l'appartenance manuellement ici.
export async function POST(request: NextRequest) {
  const { supabase, user, isBearer } = await resolveRequestUser(request);

  if (!isAuthorizedOrigin(request, isBearer)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  if (!user) {
    if (isBearer) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // La photo de profil arrive comme un champ "logo" séparé dans le
  // multipart/form-data — parseFormOrJsonBody() convertirait un File en
  // simple entrée d'objet, donc on relit le body nous-mêmes ici plutôt que
  // via ce helper partagé quand ce n'est pas du JSON.
  const contentType = request.headers.get('content-type') ?? '';
  let fields: Record<string, unknown>;
  let logoFile: File | null = null;

  if (contentType.includes('application/json')) {
    fields = await parseFormOrJsonBody(request);
  } else {
    const formData = await request.formData();
    fields = Object.fromEntries(
      Array.from(formData.entries()).filter(([key]) => key !== 'logo')
    );
    const maybeFile = formData.get('logo');
    if (maybeFile instanceof File && maybeFile.size > 0) {
      logoFile = maybeFile;
    }
  }

  const parsed = profileSchema.safeParse({
    studio_name: fields.studio_name,
    description: fields.description,
    city: fields.city,
    contact_phone: fields.contact_phone,
    contact_whatsapp: fields.contact_whatsapp,
    contact_email: fields.contact_email,
  });

  if (!parsed.success) {
    if (isBearer) return NextResponse.json({ error: 'Formulaire invalide' }, { status: 400 });
    return NextResponse.redirect(
      new URL('/dashboard/profil?error=' + encodeURIComponent('Formulaire invalide'), request.url)
    );
  }

  const updates: Record<string, unknown> = { ...parsed.data };

  if (logoFile) {
    if (!ALLOWED_LOGO_TYPES.includes(logoFile.type)) {
      const error = 'Format de photo non supporté (JPEG, PNG ou WEBP uniquement)';
      if (isBearer) return NextResponse.json({ error }, { status: 400 });
      return NextResponse.redirect(new URL('/dashboard/profil?error=' + encodeURIComponent(error), request.url));
    }
    if (logoFile.size > MAX_LOGO_SIZE) {
      const error = 'Photo trop volumineuse (5 Mo max)';
      if (isBearer) return NextResponse.json({ error }, { status: 400 });
      return NextResponse.redirect(new URL('/dashboard/profil?error=' + encodeURIComponent(error), request.url));
    }

    const buffer = Buffer.from(await logoFile.arrayBuffer());
    const resized = await sharp(buffer)
      .rotate()
      .resize({ width: 500, height: 500, fit: 'cover' })
      .jpeg({ quality: 85 })
      .toBuffer();

    const admin = createAdminClient();
    const path = `${user.id}/logo.jpg`;
    const { error: uploadError } = await admin.storage
      .from(AVATAR_BUCKET)
      .upload(path, resized, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) {
      if (isBearer) return NextResponse.json({ error: uploadError.message }, { status: 400 });
      return NextResponse.redirect(new URL('/dashboard/profil?error=' + encodeURIComponent(uploadError.message), request.url));
    }

    const { data: pub } = admin.storage.from(AVATAR_BUCKET).getPublicUrl(path);
    // upsert écrase le même chemin : on ajoute un paramètre pour invalider
    // le cache navigateur/CDN sur l'ancienne image.
    updates.logo_url = `${pub.publicUrl}?v=${Date.now()}`;
  }

  await supabase
    .from('photographers')
    .update(updates)
    .eq('profile_id', user.id);

  if (isBearer) return NextResponse.json({ success: true });
  return NextResponse.redirect(new URL('/dashboard/profil?success=1', request.url));
}
