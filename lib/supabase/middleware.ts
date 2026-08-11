import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Chaque espace privé est associé au(x) rôle(s) autorisé(s) à y accéder.
// Un utilisateur connecté mais avec le mauvais rôle est renvoyé vers SON
// propre espace plutôt que de pouvoir consulter celui d'un autre rôle.
const ROLE_AREAS: { prefix: string; roles: string[] }[] = [
  { prefix: '/admin', roles: ['admin'] },
  { prefix: '/client', roles: ['client'] },
  { prefix: '/dashboard', roles: ['photographer'] },
];

function homeForRole(role: string | undefined) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'client') return '/client/dashboard';
  if (role === 'photographer') return '/dashboard';
  return '/';
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Next.js met en cache par défaut les appels fetch() côté serveur —
      // y compris ceux de supabase-js — ce qui peut renvoyer des données
      // périmées juste après une écriture. Voir lib/supabase/server.ts.
      global: {
        fetch: (input, init) => fetch(input, { ...init, cache: 'no-store' }),
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Rafraîchit la session si besoin (obligatoire pour Server Components)
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const matchedArea = ROLE_AREAS.find((area) =>
    request.nextUrl.pathname.startsWith(area.prefix)
  );

  if (matchedArea) {
    // Non connecté → redirection vers la connexion
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', request.nextUrl.pathname);
      return NextResponse.redirect(url);
    }

    // Connecté mais mauvais rôle → redirection vers SON propre espace,
    // jamais un accès silencieusement autorisé à un espace qui n'est
    // pas le sien (cf. principe de moindre privilège).
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (!profile || !matchedArea.roles.includes(profile.role)) {
      const url = request.nextUrl.clone();
      url.pathname = homeForRole(profile?.role);
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
