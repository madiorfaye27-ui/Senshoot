import { createAdminClient } from '@/lib/supabase/server';

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
  await admin.from('order_access_tokens').insert({
    order_id: orderId,
    token: crypto.randomUUID(),
  });
}

export async function markOrderFailed(admin: AdminClient, orderId: string) {
  await admin.from('orders').update({ status: 'echouee' }).eq('id', orderId);
  await admin.from('payments').update({ status: 'echoue' }).eq('order_id', orderId);
}
