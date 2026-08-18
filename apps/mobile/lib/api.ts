import { supabase } from './supabase';

const APP_URL = process.env.EXPO_PUBLIC_APP_URL;

// Calls the web app's Next.js API routes (orders, photos, photographer/
// admin actions) with the mobile session forwarded as a bearer token —
// see lib/auth/resolveRequestUser.ts on the server side, which accepts
// this alongside the web app's own cookie-based auth.
export async function apiFetch(path: string, init?: RequestInit) {
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const headers = new Headers(init?.headers);
  headers.set('Content-Type', 'application/json');
  if (session) headers.set('Authorization', `Bearer ${session.access_token}`);

  const res = await fetch(`${APP_URL}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || `Erreur ${res.status}`);
  }
  return data;
}

export async function getAccessToken(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.access_token ?? null;
}
