import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveRequestUser, isAuthorizedOrigin, parseFormOrJsonBody } from '@/lib/auth/resolveRequestUser';

const statusSchema = z.object({
  status: z.enum(['contactee', 'confirmee', 'refusee']),
});

// Pas de policy RLS UPDATE sur "booking_requests" (migration 0017,
// même choix que "photos" et "payouts" sur ce projet) : l'appartenance
// est vérifiée ici via le client RLS-scoped (qui ne renvoie la ligne
// que si elle appartient à un photographe du profil connecté, même
// policy SELECT que la lecture), puis l'écriture passe par le client
// admin.
export async function POST(
  request: NextRequest,
  { params }: { params: { bookingId: string } }
) {
  const { supabase, user, isBearer } = await resolveRequestUser(request);

  if (!isAuthorizedOrigin(request, isBearer)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  if (!user) {
    if (isBearer) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const body = await parseFormOrJsonBody(request);
  const parsed = statusSchema.safeParse({ status: body.status });

  if (!parsed.success) {
    if (isBearer) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    return NextResponse.redirect(
      new URL('/dashboard/reservations?error=' + encodeURIComponent('Statut invalide'), request.url)
    );
  }

  const { data: booking } = await supabase
    .from('booking_requests')
    .select('id')
    .eq('id', params.bookingId)
    .single();

  if (!booking) {
    if (isBearer) return NextResponse.json({ error: 'Demande introuvable' }, { status: 404 });
    return NextResponse.redirect(new URL('/dashboard/reservations', request.url));
  }

  const admin = createAdminClient();
  await admin
    .from('booking_requests')
    .update({ status: parsed.data.status })
    .eq('id', params.bookingId);

  if (isBearer) return NextResponse.json({ success: true });
  return NextResponse.redirect(new URL('/dashboard/reservations?success=1', request.url));
}
