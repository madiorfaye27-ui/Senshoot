import { createClient } from '@/lib/supabase/server';

type Client = ReturnType<typeof createClient>;

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
