import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase/server';
import { stripe } from '@/lib/stripe/server';
import { resolveRequestUser, isAuthorizedOrigin } from '@/lib/auth/resolveRequestUser';
import { checkRateLimit } from '@/lib/utils/rate-limit';

const subscribeSchema = z.object({
  plan_id: z.string().uuid(),
  payment_method: z.enum(['stripe', 'kkiapay']),
});

// Même schéma que POST /api/orders pour l'achat de photos : le montant
// n'est jamais pris tel quel côté client, toujours recalculé depuis le
// prix réel du plan en base.
export async function POST(request: NextRequest) {
  const { supabase, user, isBearer } = await resolveRequestUser(request);

  if (!isAuthorizedOrigin(request, isBearer)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const rate = checkRateLimit(request, 'subscribe', 20, 60_000);
  if (!rate.allowed) {
    return NextResponse.json({ error: 'Trop de requêtes, réessayez plus tard.' }, { status: 429 });
  }

  if (!user) {
    return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Requête invalide' }, { status: 400 });
  }
  const { plan_id, payment_method } = parsed.data;

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!photographer) {
    return NextResponse.json({ error: 'Profil photographe introuvable' }, { status: 403 });
  }

  const { data: plan } = await supabase
    .from('plans')
    .select('id, name, price_fcfa')
    .eq('id', plan_id)
    .eq('is_active', true)
    .single();

  if (!plan) {
    return NextResponse.json({ error: 'Formule introuvable' }, { status: 400 });
  }

  const admin = createAdminClient();

  if (payment_method === 'stripe') {
    const { data: pendingPayment, error } = await admin
      .from('subscription_payments')
      .insert({
        photographer_id: photographer.id,
        plan_id: plan.id,
        provider: 'stripe',
        amount_fcfa: plan.price_fcfa,
        status: 'initie',
      })
      .select('id')
      .single();

    if (error || !pendingPayment) {
      return NextResponse.json({ error: 'Impossible de créer le paiement' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'xof',
            product_data: { name: `Abonnement Senshoot Sénégal — ${plan.name}` },
            unit_amount: plan.price_fcfa,
          },
          quantity: 1,
        },
      ],
      metadata: { subscription_payment_id: pendingPayment.id },
      // Same senshootapp:// deep-link pattern as POST /api/orders — see
      // the comment there for why mobile needs a different pair of URLs.
      success_url: isBearer
        ? `senshootapp://payment-return?result=success&subscription_payment_id=${pendingPayment.id}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/abonnement?success=1`,
      cancel_url: isBearer
        ? `senshootapp://payment-return?result=canceled&subscription_payment_id=${pendingPayment.id}`
        : `${process.env.NEXT_PUBLIC_APP_URL}/tarifs?canceled=1`,
    });

    await admin
      .from('subscription_payments')
      .update({ provider_transaction_id: session.id })
      .eq('id', pendingPayment.id);

    return NextResponse.json({ checkout_url: session.url });
  }

  // payment_method === 'kkiapay' : le widget s'ouvre côté navigateur, la
  // confirmation repasse par le serveur (voir confirm-kkiapay ci-dessous),
  // même schéma que GalleryCart pour l'achat de photos.
  const { data: pendingPayment, error } = await admin
    .from('subscription_payments')
    .insert({
      photographer_id: photographer.id,
      plan_id: plan.id,
      provider: 'kkiapay',
      amount_fcfa: plan.price_fcfa,
      status: 'initie',
    })
    .select('id')
    .single();

  if (error || !pendingPayment) {
    return NextResponse.json({ error: 'Impossible de créer le paiement' }, { status: 400 });
  }

  return NextResponse.json({ subscription_payment_id: pendingPayment.id, amount: plan.price_fcfa });
}
