import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';
import { createClient as createCookieClient } from '@/lib/supabase/server';
import type { Database } from '@/lib/supabase/database.types';
import { isSameOriginRequest } from '@/lib/utils/csrf';

function uncachedFetch(input: RequestInfo | URL, init?: RequestInit) {
  return fetch(input, { ...init, cache: 'no-store' });
}

// The web app authenticates API routes via the @supabase/ssr cookie
// session (see lib/supabase/server.ts) and guards state-changing requests
// with isSameOriginRequest (lib/utils/csrf.ts), since a cookie is ambient —
// any page in the user's browser can trigger a request that carries it.
// The mobile app has no cookies at all: it holds its own session (via
// supabase-js + AsyncStorage, see apps/mobile/lib/auth.tsx) and sends it
// explicitly as "Authorization: Bearer <access_token>". That's nothing a
// third-party page could ever attach to a request, so it needs no CSRF
// check — but it does need a Supabase client actually scoped to that
// token, both to resolve the user (auth.getUser(token)) and so RLS
// policies keyed on auth.uid() apply the same way they do for the cookie
// session (achieved by forwarding the token as the client's own
// Authorization header for its PostgREST requests).
export async function resolveRequestUser(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const bearerToken = authHeader?.toLowerCase().startsWith('bearer ')
    ? authHeader.slice(7).trim()
    : null;

  if (!bearerToken) {
    const supabase = createCookieClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return { supabase, user, isBearer: false as const };
  }

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { fetch: uncachedFetch, headers: { Authorization: `Bearer ${bearerToken}` } },
      cookies: { getAll: () => [], setAll: () => {} },
    }
  );
  const {
    data: { user },
  } = await supabase.auth.getUser(bearerToken);
  return { supabase, user, isBearer: true as const };
}

// Drop-in replacement for a bare isSameOriginRequest(request) check at the
// top of a route. The check exists to stop a malicious *web page* from
// using the victim's browser to fire a request that rides on their
// ambient session cookie. Two cases can't be that: a bearer-authenticated
// mobile request (its "session" is an explicit header, not anything a
// third-party page could attach), and any request with no Cookie header
// at all — including a mobile guest action (booking request, guest
// checkout) — since there's no ambient credential to forge in the first
// place. A cookie-carrying request (the web app, always) still requires
// the origin match.
export function isAuthorizedOrigin(request: NextRequest, isBearer: boolean): boolean {
  if (isBearer) return true;
  if (!request.headers.get('cookie')) return true;
  return isSameOriginRequest(request);
}

// A handful of routes were built around a classic HTML <form action="...">
// POST (multipart FormData in, redirect back to the page out) — fine for
// the web app, meaningless for a mobile client that has no page to render
// a redirect into and naturally wants to send/receive JSON. This lets
// those routes accept either body shape without duplicating each one's
// parsing logic; pair it with a `isBearer ? NextResponse.json(...) :
// NextResponse.redirect(...)` at the end of the handler.
export async function parseFormOrJsonBody(request: NextRequest): Promise<Record<string, unknown>> {
  const contentType = request.headers.get('content-type') ?? '';
  if (contentType.includes('application/json')) {
    return (await request.json().catch(() => ({}))) ?? {};
  }
  const formData = await request.formData();
  return Object.fromEntries(formData.entries());
}
