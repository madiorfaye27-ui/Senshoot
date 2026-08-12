import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteClient } from '@/lib/supabase/route';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { isSameOriginRequest } from '@/lib/utils/csrf';
import { localeToPrefix } from '@/lib/utils/locale';
import { sendEmail } from '@/lib/email/resend';
import { welcomeEmailFr, welcomeEmailEn } from '@/lib/email/templates';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères'),
  first_name: z.string().trim().min(1).max(100),
  last_name: z.string().trim().min(1).max(100),
  role: z.enum(['client', 'photographer']),
  terms: z.literal('on'),
});

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const formData = await request.formData();
  const locale = localeToPrefix(formData.get('locale')?.toString());

  // Limite la création de comptes par IP (anti-bot / anti-spam d'inscriptions)
  const rate = checkRateLimit(request, 'register', 5, 10 * 60_000);
  if (!rate.allowed) {
    return NextResponse.redirect(
      new URL(`${locale}/register?error=` + encodeURIComponent('Trop de tentatives, réessayez plus tard.'), request.url)
    );
  }

  const parsed = registerSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    first_name: formData.get('first_name'),
    last_name: formData.get('last_name'),
    role: formData.get('role'),
    terms: formData.get('terms'),
  });

  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message || 'Formulaire invalide';
    return NextResponse.redirect(new URL(`${locale}/register?error=` + encodeURIComponent(message), request.url));
  }

  const { email, password, first_name, last_name, role } = parsed.data;

  // Un photographe fraîchement inscrit est envoyé directement choisir une
  // formule (avec un moyen de continuer sans forfait) plutôt que sur
  // l'accueil — c'est le principal levier pour qu'il souscrive au moment
  // où son intention est la plus forte, sans complexifier ce formulaire.
  const target = role === 'photographer' ? '/tarifs' : '/';
  const response = NextResponse.redirect(new URL(`${locale}${target}`, request.url));
  const supabase = createRouteClient(request, response);

  // 1. Création du compte auth Supabase
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { first_name, last_name, role } },
  });

  if (error || !data.user) {
    // Message générique : ne pas confirmer/infirmer qu'un email est déjà
    // utilisé (évite l'énumération de comptes existants).
    return NextResponse.redirect(
      new URL(`${locale}/register?error=` + encodeURIComponent('Inscription impossible avec ces informations.'), request.url)
    );
  }

  // 2. Le profil (et l'entrée photographers si role = photographer) est créé
  // automatiquement côté serveur par le trigger `on_auth_user_created`
  // (supabase/migrations/0007_auto_create_profile.sql), à partir des
  // métadonnées passées à auth.signUp ci-dessus. Cela évite de dépendre
  // d'une session client, indisponible tant que l'email n'est pas confirmé.

  const isPhotographer = role === 'photographer';
  const isEn = locale === '/en';
  const html = isEn
    ? welcomeEmailEn({ firstName: first_name, isPhotographer })
    : welcomeEmailFr({ firstName: first_name, isPhotographer });
  void sendEmail({
    to: email,
    subject: isEn ? 'Welcome to Senshoot Sénégal' : 'Bienvenue sur Senshoot Sénégal',
    html,
  });

  return response;
}
