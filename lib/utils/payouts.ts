import { createClient } from '@/lib/supabase/server';

type Client = ReturnType<typeof createClient>;

// % reversé au photographe quand il n'a aucun forfait actif — le taux
// le plus bas de la grille, pour inciter à s'abonner (voir les taux
// par forfait dans plans.commission_rate, migration 0014).
export const NO_PLAN_COMMISSION_RATE = 70;

// Taux applicable au photographe : celui de son forfait actif s'il en
// a un, sinon le taux "sans forfait". Appliqué à tout l'historique des
// ventes (pas de suivi rétroactif du taux au moment de chaque vente —
// simplification volontaire, comme le taux fixe précédent).
export async function getCommissionRate(supabase: Client, photographerId: string): Promise<number> {
  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('plans(commission_rate)')
    .eq('photographer_id', photographerId)
    .eq('status', 'active')
    .single();

  const plan = subscription?.plans as { commission_rate: number } | { commission_rate: number }[] | null | undefined;
  const rate = Array.isArray(plan) ? plan[0]?.commission_rate : plan?.commission_rate;

  return rate ?? NO_PLAN_COMMISSION_RATE;
}

// Solde disponible = part du photographe (commission_rate %) sur ses
// commandes payées, moins ce qui a déjà été demandé en retrait (les
// demandes "pending" bloquent le solde tout comme les "completed" —
// sinon un photographe pourrait redemander deux fois le même argent
// pendant qu'un premier virement est en cours de traitement).
export async function getAvailableBalance(
  supabase: Client,
  photographerId: string,
  commissionRate: number
): Promise<number> {
  const { data: orders } = await supabase
    .from('orders')
    .select('total_fcfa')
    .eq('photographer_id', photographerId)
    .eq('status', 'payee');

  const revenue = (orders ?? []).reduce((sum, o) => sum + o.total_fcfa, 0);
  const share = Math.floor((revenue * commissionRate) / 100);

  const { data: payouts } = await supabase
    .from('payouts')
    .select('amount_fcfa')
    .eq('photographer_id', photographerId)
    .in('status', ['pending', 'completed']);

  const withdrawn = (payouts ?? []).reduce((sum, p) => sum + p.amount_fcfa, 0);

  return Math.max(0, share - withdrawn);
}
