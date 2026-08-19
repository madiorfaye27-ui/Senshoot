import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/route';

// Point d'entrée générique pour tout lien envoyé par Supabase Auth
// contenant un "code" à échanger contre une session (aujourd'hui : la
// réinitialisation de mot de passe). Le code est à usage unique et
// vérifié côté Supabase — aucune protection CSRF nécessaire ici,
// cette route ne fait que suivre un lien cliqué depuis un email.
export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code');
  const next = request.nextUrl.searchParams.get('next') || '/';

  const response = NextResponse.redirect(new URL(next, request.url));

  if (code) {
    const supabase = createRouteClient(request, response);
    await supabase.auth.exchangeCodeForSession(code);
  }

  return response;
}
