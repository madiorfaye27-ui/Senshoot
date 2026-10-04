import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteClient } from '@/lib/supabase/route';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { isSameOriginRequest } from '@/lib/utils/csrf';
import { localeToPrefix } from '@/lib/utils/locale';
import { safeNextPath } from '@/lib/utils/safe-next';

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const formData = await request.formData();
  const locale = localeToPrefix(formData.get('locale')?.toString());
  // `next` contient déjà le préfixe de langue (il vient du chemin d'origine).
  const next = safeNextPath(formData.get('next'));

  // Retour à la page de connexion avec un message, en conservant `next`
  // pour que la page voulue ne soit pas perdue après une faute de frappe.
  const backToLogin = (message: string) => {
    const url = new URL(`${locale}/login`, request.url);
    url.searchParams.set('error', message);
    if (next) url.searchParams.set('next', next);
    return NextResponse.redirect(url);
  };

  // Limite les tentatives de connexion par IP : ralentit fortement une
  // attaque par force brute sur les mots de passe (5 essais / minute).
  const rate = checkRateLimit(request, 'login', 5, 60_000);
  if (!rate.allowed) {
    return backToLogin('Trop de tentatives, réessayez dans une minute.');
  }

  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
  });

  if (!parsed.success) {
    return backToLogin('Email ou mot de passe invalide.');
  }

  const response = NextResponse.redirect(new URL(next ?? `${locale}/`, request.url));
  const supabase = createRouteClient(request, response);

  const { error } = await supabase.auth.signInWithPassword(parsed.data);

  if (error) {
    // "Email not confirmed" n'est pas une fuite d'information sensible
    // (ça ne révèle pas si le mot de passe est juste) — on peut le
    // préciser. Pour toute autre erreur (email inconnu, mauvais mot de
    // passe), message volontairement générique pour ne pas permettre
    // à quelqu'un de deviner quels emails sont inscrits (énumération).
    return backToLogin(
      error.message === 'Email not confirmed'
        ? 'Merci de confirmer votre email avant de vous connecter.'
        : 'Identifiants incorrects.'
    );
  }

  return response;
}
