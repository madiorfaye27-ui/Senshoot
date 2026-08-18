import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveRequestUser, isAuthorizedOrigin, parseFormOrJsonBody } from '@/lib/auth/resolveRequestUser';

const statusSchema = z.object({
  status: z.enum(['validated', 'rejected', 'suspended', 'pending']),
});

// Le middleware protège les PAGES sous /admin, mais pas les routes API
// sous /api/admin (préfixe différent) — cette route vérifie donc
// elle-même que l'appelant est bien admin avant d'agir. La table
// "photographers" n'a pas de policy RLS UPDATE pour un admin agissant sur
// le profil de quelqu'un d'autre (seulement "sa propre" fiche, voir
// migration 0004) : on utilise donc le client admin (service_role) pour
// l'écriture elle-même, une fois l'autorisation vérifiée ici.
export async function POST(
  request: NextRequest,
  { params }: { params: { photographerId: string } }
) {
  const { supabase, user, isBearer } = await resolveRequestUser(request);

  if (!isAuthorizedOrigin(request, isBearer)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  if (!user) {
    if (isBearer) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return NextResponse.json({ error: 'Accès refusé' }, { status: 403 });
  }

  const body = await parseFormOrJsonBody(request);
  const parsed = statusSchema.safeParse({ status: body.status });

  if (!parsed.success) {
    if (isBearer) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    return NextResponse.redirect(
      new URL('/admin/dashboard/photographes?error=' + encodeURIComponent('Statut invalide'), request.url)
    );
  }

  const admin = createAdminClient();
  await admin
    .from('photographers')
    .update({ status: parsed.data.status })
    .eq('id', params.photographerId);

  if (isBearer) return NextResponse.json({ success: true });
  return NextResponse.redirect(new URL('/admin/dashboard/photographes?success=1', request.url));
}
