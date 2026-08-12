import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { subscriptionActivatedEmailFr } from '@/lib/email/templates';
import { formatFCFA } from '@/lib/utils/format';

type AdminClient = ReturnType<typeof createAdminClient>;

const SUBSCRIPTION_DURATION_DAYS = 30;

// Utilisé par les deux webhooks de paiement (Stripe et KKiaPay) une fois
// le paiement d'abonnement confirmé côté serveur — même précaution que
// markOrderPaid (lib/utils/orders.ts) : jamais appelé sur la seule foi
// d'un retour navigateur non re-vérifié.
export async function activateSubscription(
  admin: AdminClient,
  subscriptionPaymentId: string,
  rawResponse: unknown
) {
  const { data: payment } = await admin
    .from('subscription_payments')
    .select('photographer_id, plan_id, amount_fcfa, plans(name)')
    .eq('id', subscriptionPaymentId)
    .single();

  if (!payment) return;

  await admin
    .from('subscription_payments')
    .update({ status: 'reussi', raw_response: rawResponse })
    .eq('id', subscriptionPaymentId);

  // Un seul abonnement actif à la fois par photographe : celui en cours
  // (s'il y en a un) est remplacé, jamais cumulé.
  await admin
    .from('subscriptions')
    .update({ status: 'canceled' })
    .eq('photographer_id', payment.photographer_id)
    .eq('status', 'active');

  const startsAt = new Date();
  const expiresAt = new Date(startsAt.getTime() + SUBSCRIPTION_DURATION_DAYS * 24 * 60 * 60 * 1000);

  await admin.from('subscriptions').insert({
    photographer_id: payment.photographer_id,
    plan_id: payment.plan_id,
    status: 'active',
    starts_at: startsAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    renewed_at: startsAt.toISOString(),
  });

  void notifySubscriptionActivated(admin, payment);
}

export async function markSubscriptionPaymentFailed(admin: AdminClient, subscriptionPaymentId: string) {
  await admin
    .from('subscription_payments')
    .update({ status: 'echoue' })
    .eq('id', subscriptionPaymentId);
}

async function notifySubscriptionActivated(
  admin: AdminClient,
  payment: { photographer_id: string; amount_fcfa: number; plans: { name: string } | { name: string }[] | null }
) {
  try {
    const { data: photographer } = await admin
      .from('photographers')
      .select('profile_id')
      .eq('id', payment.photographer_id)
      .single();
    if (!photographer) return;

    const { data: authUser } = await admin.auth.admin.getUserById(photographer.profile_id);
    const email = authUser?.user?.email;
    if (!email) return;

    const plan = Array.isArray(payment.plans) ? payment.plans[0] : payment.plans;

    await sendEmail({
      to: email,
      subject: 'Votre abonnement Senshoot Sénégal est actif',
      html: subscriptionActivatedEmailFr({
        planName: plan?.name ?? '',
        amountLabel: formatFCFA(payment.amount_fcfa),
      }),
    });
  } catch (err) {
    console.error('[email] Échec de la notification d\'activation d\'abonnement', err);
  }
}
