import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { routing } from '@/i18n/routing';

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

// Retire le préfixe de langue (ex: "/en") pour comparer aux préfixes
// d'espaces privés ci-dessus, qui sont eux toujours écrits en français
// (le français n'a pas de préfixe, voir i18n/routing.ts localePrefix).
const LOCALE_PREFIX_RE = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`);

function splitLocale(pathname: string) {
  const match = pathname.match(LOCALE_PREFIX_RE);
  return {
    localePrefix: match ? match[0] : '',
    pathWithoutLocale: match ? pathname.slice(match[0].length) || '/' : pathname,
  };
}

// `baseResponse` est la réponse déjà produite par le middleware next-intl
// (routage/préfixe de langue) — on y greffe la logique d'authentification
// par-dessus, au lieu de repartir d'une réponse vierge, pour ne perdre ni
// la redirection de langue ni les cookies qu'elle a pu poser.
export async function updateSession(request: NextRequest, baseResponse: NextResponse) {
  // Une redirection de langue (ex: URL sans préfixe valide) doit s'exécuter
  // telle quelle : inutile de vérifier l'authentification avant qu'elle
  // n'ait eu lieu, le middleware sera de toute façon rejoué après.
  if (baseResponse.status >= 300 && baseResponse.status < 400) {
    return baseResponse;
  }

  let supabaseResponse = baseResponse;

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      // Next.js met en cache par défaut les appels fetch() côté serveur —
      // y compris ceux de supabase-js — ce qui peut renvoyer des données
      // périmées juste après une écriture. Voir lib/supabase/server.ts.
      global: {
        fetch: (input: RequestInfo | URL, init?: RequestInit) => fetch(input, { ...init, cache: 'no-store' }),
      },
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          const refreshed = NextResponse.next({ request });
          // Reporte ce que next-intl avait déjà posé (ex: cookie de langue)
          baseResponse.cookies.getAll().forEach((c) => refreshed.cookies.set(c));
          baseResponse.headers.forEach((value, key) => {
            if (!refreshed.headers.has(key)) refreshed.headers.set(key, value);
          });
          supabaseResponse = refreshed;
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

  const { localePrefix, pathWithoutLocale } = splitLocale(request.nextUrl.pathname);

  const matchedArea = ROLE_AREAS.find((area) =>
    pathWithoutLocale.startsWith(area.prefix)
  );

  if (matchedArea) {
    // Non connecté → redirection vers la connexion
    if (!user) {
      const url = request.nextUrl.clone();
      url.pathname = `${localePrefix}/login`;
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
      url.pathname = `${localePrefix}${homeForRole(profile?.role)}`;
      return NextResponse.redirect(url);
    }
  }

  return supabaseResponse;
}
