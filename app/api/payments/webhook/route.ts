import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe/server';
import { createAdminClient } from '@/lib/supabase/server';
import { markOrderPaid, markOrderFailed } from '@/lib/utils/orders';
import Stripe from 'stripe';

// Important : la confirmation de paiement doit toujours être vérifiée
// côté serveur via le webhook signé, jamais uniquement via le retour
// du navigateur sur success_url (cf. cahier des charges, section 9).
export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get('stripe-signature')!;

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, process.env.STRIPE_WEBHOOK_SECRET!);
  } catch (err) {
    return NextResponse.json({ error: 'Signature invalide' }, { status: 400 });
  }

  const supabase = createAdminClient();

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId) await markOrderPaid(supabase, orderId, session);
  }

  if (event.type === 'checkout.session.expired') {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.metadata?.order_id;
    if (orderId) await markOrderFailed(supabase, orderId);
  }

  return NextResponse.json({ received: true });
}
