import { type NextRequest } from 'next/server';
import createIntlMiddleware from 'next-intl/middleware';
import { routing } from '@/i18n/routing';
import { updateSession } from '@/lib/supabase/middleware';

const handleI18nRouting = createIntlMiddleware(routing);

export async function middleware(request: NextRequest) {
  const intlResponse = handleI18nRouting(request);
  return await updateSession(request, intlResponse);
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|api|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
