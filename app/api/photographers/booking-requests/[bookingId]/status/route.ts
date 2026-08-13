import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { isSameOriginRequest } from '@/lib/utils/csrf';

const statusSchema = z.object({
  status: z.enum(['contactee', 'refusee']),
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
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const formData = await request.formData();
  const parsed = statusSchema.safeParse({ status: formData.get('status') });

  if (!parsed.success) {
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
    return NextResponse.redirect(new URL('/dashboard/reservations', request.url));
  }

  const admin = createAdminClient();
  await admin
    .from('booking_requests')
    .update({ status: parsed.data.status })
    .eq('id', params.bookingId);

  return NextResponse.redirect(new URL('/dashboard/reservations?success=1', request.url));
}
