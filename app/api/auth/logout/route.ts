import { NextRequest, NextResponse } from 'next/server';
import { createRouteClient } from '@/lib/supabase/route';
import { isSameOriginRequest } from '@/lib/utils/csrf';

export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const response = NextResponse.redirect(new URL('/', request.url));
  const supabase = createRouteClient(request, response);
  await supabase.auth.signOut();
  return response;
}
