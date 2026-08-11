import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/route';
import { isSameOriginRequest } from '@/lib/utils/csrf';
import { localeToPrefix } from '@/lib/utils/locale';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const locale = localeToPrefix(request.nextUrl.searchParams.get('locale'));
  const response = NextResponse.redirect(new URL(`${locale}/`, request.url));
  const supabase = createRouteClient(request, response);
  await supabase.auth.signOut();
  return response;
}
