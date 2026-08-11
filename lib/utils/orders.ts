import { createAdminClient } from '@/lib/supabase/server';
import { sendEmail } from '@/lib/email/resend';
import { orderPaidEmailFr } from '@/lib/email/templates';
import { formatFCFA } from '@/lib/utils/format';

type AdminClient = ReturnType<typeof createAdminClient>;

// Utilisé par les deux webhooks de paiement (Stripe et PayDunya) une fois
// le paiement confirmé côté serveur — jamais appelé sur la seule foi d'un
// retour navigateur ou d'une notification non re-vérifiée.
export async function markOrderPaid(admin: AdminClient, orderId: string, rawResponse: unknown) {
  await admin.from('orders').update({ status: 'payee' }).eq('id', orderId);
  await admin
    .from('payments')
    .update({ status: 'reussi', raw_response: rawResponse })
    .eq('order_id', orderId);

  // Lien/QR d'accès à usage unique vers les photos achetées
  // (voir supabase/migrations/0008_access_tokens.sql).
  const token = crypto.randomUUID();
  await admin.from('order_access_tokens').insert({
    order_id: orderId,
    token,
  });

  await notifyOrderPaid(admin, orderId, token);
}

// Best-effort : une notification email ratée ne doit jamais remettre en
// cause un paiement déjà confirmé côté provider.
async function notifyOrderPaid(admin: AdminClient, orderId: string, token: string) {
  try {
    const { data: order } = await admin
      .from('orders')
      .select('order_number, total_fcfa, client_id')
      .eq('id', orderId)
      .single();
    if (!order?.client_id) return;

    const { data: authUser } = await admin.auth.admin.getUserById(order.client_id);
    const email = authUser?.user?.email;
    if (!email) return;

    const accessUrl = `${process.env.NEXT_PUBLIC_APP_URL}/acces/${token}`;
    await sendEmail({
      to: email,
      subject: `Paiement confirmé — ${order.order_number}`,
      html: orderPaidEmailFr({
        orderNumber: order.order_number,
        totalLabel: formatFCFA(order.total_fcfa),
        accessUrl,
      }),
    });
  } catch (err) {
    console.error('[email] Échec de la notification de commande payée', err);
  }
}

export async function markOrderFailed(admin: AdminClient, orderId: string) {
  await admin.from('orders').update({ status: 'echouee' }).eq('id', orderId);
  await admin.from('payments').update({ status: 'echoue' }).eq('order_id', orderId);
}
