import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

// JSON counterpart of app/[locale]/(public)/acces/[token]/page.tsx, for
// the mobile app (which has no server-rendered page to run this query
// in, and can never hold the service_role key the way that Server
// Component safely does). Same single-use semantics: the first GET
// consumes the token exactly like the first render of the web page does.
export async function GET(request: NextRequest, { params }: { params: { token: string } }) {
  const admin = createAdminClient();

  const { data: accessToken } = await admin
    .from('order_access_tokens')
    .select('*, orders(*, order_items(*, photos(*)))')
    .eq('token', params.token)
    .single();

  if (!accessToken) {
    return NextResponse.json({ error: 'Lien invalide' }, { status: 404 });
  }

  if (accessToken.used_at) {
    return NextResponse.json({ used: true }, { status: 200 });
  }

  await admin
    .from('order_access_tokens')
    .update({ used_at: new Date().toISOString() })
    .eq('id', accessToken.id);

  return NextResponse.json({ used: false, order: accessToken.orders });
}
