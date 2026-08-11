import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from './database.types';

/**
 * Client Supabase à utiliser dans les routes API (app/api/**\/route.ts)
 * qui répondent par une redirection (NextResponse.redirect), typiquement
 * après une connexion ou une inscription.
 *
 * Contrairement au client de server.ts (qui écrit via next/headers
 * cookies(), peu fiable une fois qu'on retourne un NextResponse.redirect
 * fraîchement créé), celui-ci écrit les cookies DIRECTEMENT sur l'objet
 * `response` qui sera renvoyé — garantissant que la session est bien
 * persistée dans le navigateur.
 *
 * Usage :
 *   const response = NextResponse.redirect(new URL('/', request.url));
 *   const supabase = createRouteClient(request, response);
 *   const { error } = await supabase.auth.signInWithPassword({ email, password });
 *   if (error) return NextResponse.redirect(new URL('/login?error=...', request.url));
 *   return response; // contient maintenant les cookies de session
 */
export function createRouteClient(request: NextRequest, response: NextResponse) {
  return createServerClient<Database>(
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
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );
}
