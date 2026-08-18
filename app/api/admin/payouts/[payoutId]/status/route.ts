import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { resolveRequestUser, isAuthorizedOrigin, parseFormOrJsonBody } from '@/lib/auth/resolveRequestUser';
import { sendEmail } from '@/lib/email/resend';
import { payoutProcessedEmailFr } from '@/lib/email/templates';
import { formatFCFA } from '@/lib/utils/format';

const statusSchema = z.object({
  status: z.enum(['completed', 'rejected']),
  admin_note: z.string().trim().max(500).optional().default(''),
});

// Même schéma de protection que
// app/api/admin/photographers/[photographerId]/status/route.ts : la
// table "payouts" n'a pas de policy RLS UPDATE (volontairement — voir
// migration 0013), donc le client admin (service_role) n'est utilisé
// qu'une fois le rôle admin vérifié ici.
export async function POST(
  request: NextRequest,
  { params }: { params: { payoutId: string } }
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
  const parsed = statusSchema.safeParse({
    status: body.status,
    admin_note: body.admin_note ?? undefined,
  });

  if (!parsed.success) {
    if (isBearer) return NextResponse.json({ error: 'Statut invalide' }, { status: 400 });
    return NextResponse.redirect(
      new URL('/admin/dashboard/retraits?error=' + encodeURIComponent('Statut invalide'), request.url)
    );
  }

  const admin = createAdminClient();
  const { data: updated } = await admin
    .from('payouts')
    .update({
      status: parsed.data.status,
      admin_note: parsed.data.admin_note || null,
      processed_at: new Date().toISOString(),
    })
    .eq('id', params.payoutId)
    .eq('status', 'pending') // ne modifie jamais un retrait déjà traité
    .select('amount_fcfa, photographer_id, photographers(profile_id)')
    .single();

  if (updated) {
    void notifyPayoutProcessed(admin, updated, parsed.data.status, parsed.data.admin_note || null);
  }

  if (isBearer) return NextResponse.json({ success: true });
  return NextResponse.redirect(new URL('/admin/dashboard/retraits?success=1', request.url));
}

async function notifyPayoutProcessed(
  admin: ReturnType<typeof createAdminClient>,
  payout: { amount_fcfa: number; photographers: { profile_id: string } | { profile_id: string }[] | null },
  status: 'completed' | 'rejected',
  adminNote: string | null
) {
  try {
    const profileId = Array.isArray(payout.photographers)
      ? payout.photographers[0]?.profile_id
      : payout.photographers?.profile_id;
    if (!profileId) return;

    const { data: authUser } = await admin.auth.admin.getUserById(profileId);
    const email = authUser?.user?.email;
    if (!email) return;

    await sendEmail({
      to: email,
      subject: status === 'completed' ? 'Votre retrait a été effectué' : 'Votre retrait a été rejeté',
      html: payoutProcessedEmailFr({ amountLabel: formatFCFA(payout.amount_fcfa), status, adminNote }),
    });
  } catch (err) {
    console.error('[email] Échec de la notification de retrait', err);
  }
}
