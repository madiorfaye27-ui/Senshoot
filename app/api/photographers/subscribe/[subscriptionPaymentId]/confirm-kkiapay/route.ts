import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { verifyKkiapayTransaction } from '@/lib/kkiapay/server';
import { activateSubscription } from '@/lib/utils/subscriptions';
import { resolveRequestUser, isAuthorizedOrigin } from '@/lib/auth/resolveRequestUser';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const confirmSchema = z.object({ transaction_id: z.string().min(1) });

// Même vérification que POST /api/orders/[orderId]/confirm-kkiapay : on
// ne fait jamais confiance au seul retour "succès" du widget navigateur,
// la transaction est revérifiée auprès de KKiaPay avec nos clés serveur.
export async function POST(
  request: NextRequest,
  { params }: { params: { subscriptionPaymentId: string } }
) {
  const { supabase, user, isBearer } = await resolveRequestUser(request);

  if (!isAuthorizedOrigin(request, isBearer)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const rate = checkRateLimit(request, `confirm-subscription-kkiapay:${user.id}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez plus tard.' }, { status: 429 });
  }

  const parsed = confirmSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  const { data: payment } = await supabase
    .from('subscription_payments')
    .select('id, amount_fcfa, status, photographers(profile_id)')
    .eq('id', params.subscriptionPaymentId)
    .single();

  const photographerRel = payment?.photographers as
    | { profile_id: string }
    | { profile_id: string }[]
    | null
    | undefined;
  const ownerId = Array.isArray(photographerRel) ? photographerRel[0]?.profile_id : photographerRel?.profile_id;

  if (!payment || ownerId !== user.id) {
    return NextResponse.json({ error: 'Paiement introuvable' }, { status: 404 });
  }

  if (payment.status === 'reussi') {
    return NextResponse.json({ success: true });
  }

  const verification = await verifyKkiapayTransaction(parsed.data.transaction_id);

  if (!verification.success || verification.amount !== payment.amount_fcfa) {
    return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 });
  }

  const admin = createAdminClient();

  // La contrainte unique sur provider_transaction_id (migration 0015)
  // empêche qu'une même transaction KKiaPay active deux abonnements.
  const { data: updated, error: updateError } = await admin
    .from('subscription_payments')
    .update({ provider_transaction_id: parsed.data.transaction_id })
    .eq('id', payment.id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: 'Ce paiement a déjà été utilisé pour un autre abonnement.' },
      { status: 409 }
    );
  }

  await activateSubscription(admin, payment.id, verification.raw);

  return NextResponse.json({ success: true });
}
