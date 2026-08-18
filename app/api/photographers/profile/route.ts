import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveRequestUser, isAuthorizedOrigin, parseFormOrJsonBody } from '@/lib/auth/resolveRequestUser';

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

  const body = await parseFormOrJsonBody(request);
  const parsed = profileSchema.safeParse({
    studio_name: body.studio_name,
    description: body.description,
    city: body.city,
    contact_phone: body.contact_phone,
    contact_whatsapp: body.contact_whatsapp,
    contact_email: body.contact_email,
  });

  if (!parsed.success) {
    if (isBearer) return NextResponse.json({ error: 'Formulaire invalide' }, { status: 400 });
    return NextResponse.redirect(
      new URL('/dashboard/profil?error=' + encodeURIComponent('Formulaire invalide'), request.url)
    );
  }

  await supabase
    .from('photographers')
    .update(parsed.data)
    .eq('profile_id', user.id);

  if (isBearer) return NextResponse.json({ success: true });
  return NextResponse.redirect(new URL('/dashboard/profil?success=1', request.url));
}
