import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { generateOrderId } from '@/lib/utils/format';
import { checkRateLimit } from '@/lib/utils/rate-limit';
import { computeOrderPricing } from '@/lib/utils/pricing';
import { resolveRequestUser } from '@/lib/auth/resolveRequestUser';

const orderSchema = z.object({
  event_id: z.string().uuid(),
  photo_ids: z.array(z.string().uuid()).min(1).max(200),
  payment_method: z.enum(['stripe', 'kkiapay']),
  guest_email: z.string().trim().email().optional(),
});

// Un client n'a pas besoin de compte pour acheter : s'il n'est pas
// connecté, son email (obligatoire dans ce cas) sert à lui envoyer le
// lien d'accès à usage unique à ses photos après paiement — c'est le
// seul moyen de le recontacter puisqu'il n'a pas de tableau de bord.
export async function POST(request: NextRequest) {
  // Limite les tentatives de création de commande par IP (anti-abus /
  // anti-bombardement de sessions Stripe).
  const rate = checkRateLimit(request, 'orders', 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez plus tard.' }, { status: 429 });
  }

  const body = await request.json().catch(() => null);
  const parsed = orderSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }
  const { event_id, photo_ids, payment_method, guest_email } = parsed.data;

  const { supabase, user, isBearer } = await resolveRequestUser(request);

  if (!user && !guest_email) {
    return NextResponse.json({ error: 'Email requis pour un achat sans compte' }, { status: 400 });
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
  // par le client, qui pourrait être falsifiée. Applique au passage la
  // remise de 10% par photo dès 2 photos sélectionnées (voir
  // lib/utils/pricing.ts).
  const { total_fcfa, unitPrices } = computeOrderPricing(photos);

  // Écriture via le client admin dans tous les cas : un invité n'a pas
  // de session (auth.uid() est null), donc les policies RLS "client_id
  // = auth.uid()" ne s'appliqueraient de toute façon pas à sa commande
  // — la vérification de sécurité a déjà eu lieu ci-dessus (événement,
  // photos, prix recalculés côté serveur), pas besoin de RLS en plus ici.
  const admin = createAdminClient();

  const { count } = await admin.from('orders').select('*', { count: 'exact', head: true });
  const order_number = generateOrderId((count ?? 0) + 1);

  const { data: order, error } = await admin
    .from('orders')
    .insert({
      order_number,
      client_id: user?.id ?? null,
      guest_email: user ? null : guest_email,
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

  await admin.from('order_items').insert(
    photos.map((p) => ({
      order_id: order.id,
      photo_id: p.id,
      unit_price_fcfa: unitPrices[p.id],
    }))
  );

  if (payment_method === 'stripe') {
    // Un invité n'a pas de tableau de bord où atterrir : il retrouve ses
    // photos via le lien envoyé par email (voir markOrderPaid), la page
    // de succès se contente de le lui rappeler.
    //
    // Mobile has no page to land a browser redirect on — it opens this
    // checkout_url in an in-app browser (expo-web-browser's
    // openAuthSessionAsync) which watches for and intercepts the
    // "senshootapp://" scheme itself, closing the browser and handing the
    // result straight back to the calling screen. The actual payment
    // confirmation still only ever happens via the Stripe webhook below,
    // same as web — these URLs are purely where the browser lands/closes.
    const successUrl = isBearer
      ? `senshootapp://payment-return?result=success&order_id=${order.id}`
      : user
        ? `${process.env.NEXT_PUBLIC_APP_URL}/client/dashboard/commandes?success=1`
        : `${process.env.NEXT_PUBLIC_APP_URL}/commande-confirmee`;
    const cancelUrl = isBearer
      ? `senshootapp://payment-return?result=canceled&order_id=${order.id}`
      : `${process.env.NEXT_PUBLIC_APP_URL}/galerie/${event_id}?canceled=1`;

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      customer_email: user ? undefined : guest_email,
      line_items: photos.map((p) => ({
        price_data: {
          currency: 'xof',
          product_data: { name: `Photo #${p.photo_number}` },
          unit_amount: unitPrices[p.id],
        },
        quantity: 1,
      })),
      metadata: { order_id: order.id },
      success_url: successUrl,
      cancel_url: cancelUrl,
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
