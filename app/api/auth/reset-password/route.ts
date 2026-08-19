import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteClient } from '@/lib/supabase/route';
import { isSameOriginRequest } from '@/lib/utils/csrf';
import { localeToPrefix } from '@/lib/utils/locale';

const schema = z
  .object({
    password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
    confirm_password: z.string(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Les mots de passe ne correspondent pas.',
    path: ['confirm_password'],
  });

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const formData = await request.formData();
  const locale = localeToPrefix(formData.get('locale')?.toString());

  const parsed = schema.safeParse({
    password: formData.get('password'),
    confirm_password: formData.get('confirm_password'),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Formulaire invalide';
    return NextResponse.redirect(new URL(`${locale}/reset-password?error=` + encodeURIComponent(message), request.url));
  }

  // La session de récupération (posée par /api/auth/callback après le
  // clic sur le lien reçu par email) est ce qui autorise ce changement —
  // aucun mot de passe actuel n'est demandé, par design du flux Supabase.
  const response = NextResponse.redirect(
    new URL(`${locale}/login?success=` + encodeURIComponent('Mot de passe mis à jour, vous pouvez vous connecter.'), request.url)
  );
  const supabase = createRouteClient(request, response);

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return NextResponse.redirect(
      new URL(`${locale}/reset-password?error=` + encodeURIComponent('Lien invalide ou expiré. Merci de refaire une demande.'), request.url)
    );
  }

  // Referme la session de récupération temporaire : on force une
  // reconnexion explicite avec le nouveau mot de passe plutôt que de
  // laisser cette session spéciale se prolonger silencieusement.
  await supabase.auth.signOut();

  return response;
}
