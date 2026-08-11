import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isSameOriginRequest } from '@/lib/utils/csrf';
import { getAvailableBalance } from '@/lib/utils/payouts';

const payoutSchema = z.object({
  amount_fcfa: z.coerce.number().int().positive(),
  payout_method: z.enum(['wave', 'orange_money', 'banque']),
  payout_details: z.string().trim().min(3).max(200),
});

// Pas d'étape d'approbation admin : la demande est immédiatement valide
// dès qu'elle passe la vérification de solde ci-dessous — voir la
// discussion produit dans la conversation qui a introduit cette route.
// L'admin n'a plus qu'à exécuter le virement réel (Wave/Orange
// Money/banque) hors plateforme et à marquer la demande "payée"
// (aucune API de décaissement automatique n'est branchée aujourd'hui).
export async function POST(request: NextRequest) {
  if (!isSameOriginRequest(request)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id, commission_rate')
    .eq('profile_id', user.id)
    .single();

  if (!photographer) {
    return NextResponse.redirect(new URL('/dashboard/ventes', request.url));
  }

  const formData = await request.formData();
  const parsed = payoutSchema.safeParse({
    amount_fcfa: formData.get('amount_fcfa'),
    payout_method: formData.get('payout_method'),
    payout_details: formData.get('payout_details'),
  });

  if (!parsed.success) {
    return NextResponse.redirect(
      new URL('/dashboard/ventes?error=' + encodeURIComponent('Formulaire de retrait invalide.'), request.url)
    );
  }

  // Le solde est recalculé côté serveur — jamais fait confiance à une
  // valeur envoyée par le client, qui pourrait être falsifiée.
  const available = await getAvailableBalance(supabase, photographer.id, photographer.commission_rate);

  if (parsed.data.amount_fcfa > available) {
    return NextResponse.redirect(
      new URL('/dashboard/ventes?error=' + encodeURIComponent('Montant supérieur à votre solde disponible.'), request.url)
    );
  }

  const { error } = await supabase.from('payouts').insert({
    photographer_id: photographer.id,
    amount_fcfa: parsed.data.amount_fcfa,
    payout_method: parsed.data.payout_method,
    payout_details: parsed.data.payout_details,
  });

  if (error) {
    return NextResponse.redirect(
      new URL('/dashboard/ventes?error=' + encodeURIComponent('Impossible de créer la demande de retrait.'), request.url)
    );
  }

  return NextResponse.redirect(new URL('/dashboard/ventes?success=1', request.url));
}
