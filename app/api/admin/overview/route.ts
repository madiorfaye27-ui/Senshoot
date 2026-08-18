import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser';

// The web admin pages (app/[locale]/(admin)/admin/dashboard/**) each run
// their own createAdminClient() query directly in a Server Component —
// safe there since service_role never leaves the server. The mobile app
// has no equivalent server context of its own, and must never hold that
// key, so it needs an actual endpoint to call instead. One combined route
// (rather than five) since this is admin-only, low-traffic, and a mobile
// dashboard wants all of it up front anyway.
export async function GET(request: NextRequest) {
  const { user, supabase } = await resolveRequestUser(request);
  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const admin = createAdminClient();

  const [photographers, payouts, subscriptions, orders, profiles, authUsers] = await Promise.all([
    admin.from('photographers').select('*, profiles(first_name, last_name, phone)').order('created_at', { ascending: false }).limit(200),
    admin.from('payouts').select('*, photographers(studio_name, slug)').order('requested_at', { ascending: false }).limit(200),
    admin.from('subscriptions').select('*, photographers(studio_name, slug), plans(name, price_fcfa)').order('created_at', { ascending: false }).limit(200),
    admin.from('orders').select('*, profiles(first_name, last_name), photographers(studio_name)').order('created_at', { ascending: false }).limit(100),
    admin.from('profiles').select('*').order('created_at', { ascending: false }).limit(300),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailById = new Map((authUsers.data?.users ?? []).map((u) => [u.id, u.email ?? '']));
  const users = (profiles.data ?? []).map((p) => ({ ...p, email: emailById.get(p.id) ?? null }));

  return NextResponse.json({
    photographers: photographers.data ?? [],
    payouts: payouts.data ?? [],
    subscriptions: subscriptions.data ?? [],
    orders: orders.data ?? [],
    users,
  });
}
