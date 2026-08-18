import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { resolveRequestUser, isAuthorizedOrigin, parseFormOrJsonBody } from '@/lib/auth/resolveRequestUser';
import { getAvailableBalance, getCommissionRate } from '@/lib/utils/payouts';

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
  const { supabase, user, isBearer } = await resolveRequestUser(request);

  if (!isAuthorizedOrigin(request, isBearer)) {
    return NextResponse.json({ error: 'Requête refusée' }, { status: 403 });
  }

  if (!user) {
    if (isBearer) return NextResponse.json({ error: 'Non authentifié' }, { status: 401 });
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('profile_id', user.id)
    .single();

  if (!photographer) {
    if (isBearer) return NextResponse.json({ error: 'Profil photographe introuvable' }, { status: 403 });
    return NextResponse.redirect(new URL('/dashboard/ventes', request.url));
  }

  const body = await parseFormOrJsonBody(request);
  const parsed = payoutSchema.safeParse({
    amount_fcfa: body.amount_fcfa,
    payout_method: body.payout_method,
    payout_details: body.payout_details,
  });

  if (!parsed.success) {
    if (isBearer) return NextResponse.json({ error: 'Formulaire de retrait invalide.' }, { status: 400 });
    return NextResponse.redirect(
      new URL('/dashboard/ventes?error=' + encodeURIComponent('Formulaire de retrait invalide.'), request.url)
    );
  }

  // Le solde est recalculé côté serveur — jamais fait confiance à une
  // valeur envoyée par le client, qui pourrait être falsifiée.
  const commissionRate = await getCommissionRate(supabase, photographer.id);
  const available = await getAvailableBalance(supabase, photographer.id, commissionRate);

  if (parsed.data.amount_fcfa > available) {
    if (isBearer) {
      return NextResponse.json({ error: 'Montant supérieur à votre solde disponible.' }, { status: 400 });
    }
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
    if (isBearer) {
      return NextResponse.json({ error: 'Impossible de créer la demande de retrait.' }, { status: 400 });
    }
    return NextResponse.redirect(
      new URL('/dashboard/ventes?error=' + encodeURIComponent('Impossible de créer la demande de retrait.'), request.url)
    );
  }

  if (isBearer) return NextResponse.json({ success: true });
  return NextResponse.redirect(new URL('/dashboard/ventes?success=1', request.url));
}
