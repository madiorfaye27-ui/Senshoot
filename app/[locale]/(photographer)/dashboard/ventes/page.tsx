import { createClient } from '@/lib/supabase/server';
import { formatFCFA } from '@/lib/utils/format';

export default async function VentesPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('profile_id', user?.id)
    .single();

  const { data: orders } = await supabase
    .from('orders')
    .select('*')
    .eq('photographer_id', photographer?.id)
    .order('created_at', { ascending: false });

  const total = (orders ?? [])
    .filter((o) => o.status === 'payee')
    .reduce((sum, o) => sum + o.total_fcfa, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">Ventes & revenus</h1>
      <p className="mt-2 text-sm text-gray-500">
        Chiffre d'affaires : <span className="font-semibold text-sn-teal">{formatFCFA(total)}</span>
        {' · '}Revenu estimé ({photographer ? '90%' : '—'}) :{' '}
        <span className="font-semibold text-sn-teal">{formatFCFA(Math.round(total * 0.9))}</span>
      </p>

      <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-100">
        {(orders ?? []).map((o) => (
          <div key={o.id} className="flex items-center justify-between p-4 text-sm">
            <span className="font-mono text-gray-500">{o.order_number}</span>
            <span>{formatFCFA(o.total_fcfa)}</span>
            <span className="capitalize">{o.status}</span>
          </div>
        ))}
        {!orders?.length && (
          <p className="p-8 text-center text-sm text-gray-400">Aucune vente pour le moment.</p>
        )}
      </div>
    </div>
  );
}
