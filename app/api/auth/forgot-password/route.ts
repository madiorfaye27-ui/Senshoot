import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createRouteClient } from '@/lib/supabase/route';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { isSameOriginRequest } from '@/lib/utils/csrf';
import { localeToPrefix } from '@/lib/utils/locale';

const schema = z.object({ email: z.string().email() });

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const formData = await request.formData();
  const locale = localeToPrefix(formData.get('locale')?.toString());

  // Limite les demandes par IP (anti-spam d'emails / anti-énumération)
  const rate = checkRateLimit(request, 'forgot-password', 5, 10 * 60_000);
  if (!rate.allowed) {
    return NextResponse.redirect(
      new URL(`${locale}/forgot-password?error=` + encodeURIComponent('Trop de tentatives, réessayez plus tard.'), request.url)
    );
  }

  const parsed = schema.safeParse({ email: formData.get('email') });

  // Toujours rediriger vers le même message de succès, que l'email
  // existe ou non, et sans jamais faire dépendre la réponse du résultat
  // de resetPasswordForEmail — même principe anti-énumération que
  // l'inscription (register/route.ts).
  const response = NextResponse.redirect(new URL(`${locale}/forgot-password?success=1`, request.url));

  if (parsed.success) {
    const supabase = createRouteClient(request, response);
    const next = `${locale}/reset-password`;
    await supabase.auth.resetPasswordForEmail(parsed.data.email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/api/auth/callback?next=${encodeURIComponent(next)}`,
    });
  }

  return response;
}
