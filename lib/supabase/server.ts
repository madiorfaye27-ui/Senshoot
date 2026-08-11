import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import type { Database } from './database.types';

// Next.js met en cache par défaut tout appel fetch() fait côté serveur —
// y compris ceux que supabase-js effectue en interne vers l'API REST de
// Supabase. Sans ceci, une lecture peut renvoyer une réponse mise en
// cache et périmée juste après une écriture (RLS bien respectée, mais
// données obsolètes affichées). On désactive donc explicitement ce cache
// pour tous les appels Supabase côté serveur.
function uncachedFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, cache: 'no-store' });
}

export function createClient() {
  const cookieStore = cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: uncachedFetch },
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Appelé depuis un Server Component : ignorer si un middleware
            // gère déjà le rafraîchissement de session.
          }
        },
      },
    }
  );
}

// Client "admin" avec la clé service_role : à utiliser UNIQUEMENT côté
// serveur (jamais exposé au client), pour les opérations qui doivent
// contourner les Row Level Security policies (ex : webhooks de paiement).
export function createAdminClient() {
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      global: { fetch: uncachedFetch },
      cookies: {
        getAll() {
          return [];
        },
        setAll() {},
      },
    }
  );
}
