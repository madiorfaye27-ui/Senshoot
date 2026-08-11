import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient, createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { generateOrderId } from '@/lib/utils/format';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const orderSchema = z.object({
  event_id: z.string().uuid(),
  photo_ids: z.array(z.string().uuid()).min(1).max(200),
  payment_method: z.enum(['stripe', 'kkiapay']),
});

export async function POST(request: NextRequest) {
  // Limite les tentatives de création de commande par IP (anti-abus /
  // anti-bombardement de sessions Stripe).
  const rate = checkRateLimit(request, 'orders', 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez plus tard.' }, { status: 429 });
  }

  const supabase = createClient();

  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }
  const { event_id, photo_ids, payment_method } = parsed.data;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const { data: event } = await supabase
    .from('events')
    .select('id, photographer_id')
    .eq('id', event_id)
    .single();

  // On ne sélectionne que des photos appartenant bien à la galerie de CET
  // événement : impossible de mélanger des photos d'un autre événement
  // dans le calcul du prix.
  const { data: photos } = await supabase
    .from('photos')
    .select('*, galleries!inner(event_id)')
    .in('id', photo_ids)
    .eq('galleries.event_id', event_id);

  if (!event || !photos?.length) {
    return NextResponse.json({ error: 'Photos ou événement introuvable' }, { status: 400 });
  }

  // Le prix total est TOUJOURS recalculé depuis la base de données à
  // partir des prix réels enregistrés — jamais depuis une valeur envoyée
  // par le client, qui pourrait être falsifiée.
  const total_fcfa = photos.reduce((sum, p) => sum + p.price_fcfa, 0);

  const { count } = await supabase.from('orders').select('*', { count: 'exact', head: true });
  const order_number = generateOrderId((count ?? 0) + 1);

  const { data: order, error } = await supabase
    .from('orders')
    .insert({
      order_number,
      client_id: user.id,
      photographer_id: event.photographer_id,
      event_id: event.id,
      total_fcfa,
      payment_method,
      status: 'en_attente',
    })
    .select()
    .single();

  if (error || !order) {
    return NextResponse.json({ error: error?.message }, { status: 400 });
  }

  await supabase.from('order_items').insert(
    photos.map((p) => ({
      order_id: order.id,
      photo_id: p.id,
      unit_price_fcfa: p.price_fcfa,
    }))
  );

  // La table "payments" n'accepte aucune écriture d'un utilisateur normal
  // (RLS, voir migration 0004) : seul le client admin (service_role)
  // peut y écrire, ce qui empêche un client de falsifier un statut de
  // paiement.
  const admin = createAdminClient();

  if (payment_method === 'stripe') {
    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: photos.map((p) => ({
        price_data: {
          currency: 'xof',
          product_data: { name: `Photo #${p.photo_number}` },
          unit_amount: p.price_fcfa,
        },
        quantity: 1,
      })),
      metadata: { order_id: order.id },
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/client/dashboard/commandes?success=1`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/galerie/${event_id}?canceled=1`,
    });

    await admin.from('payments').insert({
      order_id: order.id,
      provider: 'stripe',
      provider_transaction_id: session.id,
      amount_fcfa: total_fcfa,
      status: 'initie',
    });

    return NextResponse.json({ checkout_url: session.url });
  }

  // payment_method === 'kkiapay' (Wave / Orange Money / carte via KKiaPay) :
  // pas de session hébergée à créer côté serveur ici — le widget KKiaPay
  // s'ouvre directement dans le navigateur du client (voir GalleryCart.tsx),
  // puis POST /api/orders/[orderId]/confirm-kkiapay revérifie le paiement.
  await admin.from('payments').insert({
    order_id: order.id,
    provider: 'kkiapay',
    amount_fcfa: total_fcfa,
    status: 'initie',
  });

  return NextResponse.json({ order_id: order.id, amount: total_fcfa });
}
