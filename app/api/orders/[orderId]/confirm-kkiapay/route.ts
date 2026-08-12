import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { verifyKkiapayTransaction } from '@/lib/kkiapay/server';
import { markOrderPaid } from '@/lib/utils/orders';
import { isSameOriginRequest } from '@/lib/utils/csrf';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const confirmSchema = z.object({ transaction_id: z.string().min(1) });

// Le widget KKiaPay tourne côté navigateur : on ne fait jamais confiance à
// son seul retour "succès". Cette route revérifie la transaction auprès de
// KKiaPay avec nos propres clés serveur (voir lib/kkiapay/server.ts) avant
// de marquer quoi que ce soit comme payé.
//
// Pas d'authentification requise : un invité (achat sans compte, voir
// migration 0016) doit pouvoir confirmer sa propre commande. L'order_id
// (UUID non devinable, connu seulement du navigateur qui vient de créer
// la commande) fait office de preuve de possession — même niveau de
// sécurité que la vérification de transaction KKiaPay elle-même.
export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const rate = checkRateLimit(request, `confirm-kkiapay:${user?.id ?? request.headers.get('x-forwarded-for') ?? 'anon'}`, 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez plus tard.' }, { status: 429 });
  }

  const parsed = confirmSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }

  const admin = createAdminClient();

  let orderQuery = admin
    .from('orders')
    .select('id, total_fcfa, status, client_id')
    .eq('id', params.orderId);

  // Un utilisateur connecté ne peut confirmer que SA commande ; un invité
  // n'a que l'order_id (déjà la seule preuve disponible pour lui).
  if (user) {
    orderQuery = orderQuery.eq('client_id', user.id);
  }

  const { data: order } = await orderQuery.single();

  if (!order) {
    return NextResponse.json({ error: 'Commande introuvable' }, { status: 404 });
  }

  if (order.status === 'payee') {
    return NextResponse.json({ success: true });
  }

  const verification = await verifyKkiapayTransaction(parsed.data.transaction_id);

  // Le montant confirmé par KKiaPay doit correspondre exactement au total
  // recalculé de la commande — empêche de valider une commande avec la
  // transaction (légitime mais insuffisante) d'une autre commande.
  if (!verification.success || verification.amount !== order.total_fcfa) {
    return NextResponse.json({ error: 'Paiement non confirmé' }, { status: 400 });
  }

  // La contrainte unique sur payments.provider_transaction_id (migration
  // 0011) empêche qu'un même paiement KKiaPay confirme deux commandes
  // différentes — si ce transaction_id a déjà servi ailleurs, cet UPDATE
  // échoue (0 ligne concernée par CETTE commande) et on refuse.
  const { data: updated, error: updateError } = await admin
    .from('payments')
    .update({ provider_transaction_id: parsed.data.transaction_id })
    .eq('order_id', order.id)
    .select()
    .single();

  if (updateError || !updated) {
    return NextResponse.json(
      { error: 'Ce paiement a déjà été utilisé pour une autre commande.' },
      { status: 409 }
    );
  }

  const token = await markOrderPaid(admin, order.id, verification.raw);

  return NextResponse.json({ success: true, access_url: `/acces/${token}` });
}
