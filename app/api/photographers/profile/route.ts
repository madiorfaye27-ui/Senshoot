import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isSameOriginRequest } from '@/lib/utils/csrf';

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
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const formData = await request.formData();
  const parsed = profileSchema.safeParse({
    studio_name: formData.get('studio_name'),
    description: formData.get('description'),
    city: formData.get('city'),
    contact_phone: formData.get('contact_phone'),
    contact_whatsapp: formData.get('contact_whatsapp'),
    contact_email: formData.get('contact_email'),
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      new URL('/dashboard/profil?error=' + encodeURIComponent('Formulaire invalide'), request.url)
    );
  }

  await supabase
    .from('photographers')
    .update(parsed.data)
    .eq('profile_id', user.id);

  return NextResponse.redirect(new URL('/dashboard/profil?success=1', request.url));
}
