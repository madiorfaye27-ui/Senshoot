import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { formatFCFA, formatDate } from '@/lib/utils/format';
import { getAvailableBalance, getCommissionRate } from '@/lib/utils/payouts';

export default async function VentesPage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  const t = await getTranslations('VentesPage');
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

  const commissionRate = photographer ? await getCommissionRate(supabase, photographer.id) : 0;
  const available = photographer
    ? await getAvailableBalance(supabase, photographer.id, commissionRate)
    : 0;

  const { data: payouts } = photographer
    ? await supabase
        .from('payouts')
        .select('*')
        .eq('photographer_id', photographer.id)
        .order('requested_at', { ascending: false })
    : { data: [] };

  const payoutStatusLabels: Record<string, string> = {
    pending: t('payoutStatusPending'),
    completed: t('payoutStatusCompleted'),
    rejected: t('payoutStatusRejected'),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">{t('title')}</h1>
      <p className="mt-2 text-sm text-gray-500">
        {t('revenue')} <span className="font-semibold text-sn-teal">{formatFCFA(total)}</span>
        {' · '}{t('estimatedRevenue', { percent: photographer ? `${commissionRate}%` : '—' })}{' '}
        <span className="font-semibold text-sn-teal">{formatFCFA(Math.round((total * commissionRate) / 100))}</span>
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
          <p className="p-8 text-center text-sm text-gray-400">{t('empty')}</p>
        )}
      </div>

      <div className="mt-10 border-t border-gray-100 pt-6">
        <p className="text-sm text-gray-500">
          {t('availableBalance')}{' '}
          <span className="text-lg font-bold text-sn-orange">{formatFCFA(available)}</span>
        </p>

        {searchParams.success && (
          <p className="mt-3 rounded-lg bg-sn-teal/10 p-3 text-sm text-sn-teal">{t('successPayout')}</p>
        )}
        {searchParams.error && (
          <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-600">{searchParams.error}</p>
        )}

        {available > 0 ? (
          <form action="/api/photographers/payouts" method="post" className="mt-4 max-w-sm space-y-3">
            <h2 className="text-sm font-semibold text-sn-slate">{t('requestPayout')}</h2>
            <div>
              <label className="mb-1 block text-xs font-medium text-sn-slate">{t('payoutAmount')}</label>
              <input
                type="number"
                name="amount_fcfa"
                min={1}
                max={available}
                required
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-sn-slate">{t('payoutMethod')}</label>
              <select name="payout_method" className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm">
                <option value="wave">{t('methodWave')}</option>
                <option value="orange_money">{t('methodOrangeMoney')}</option>
                <option value="banque">{t('methodBank')}</option>
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-sn-slate">{t('payoutDetails')}</label>
              <input
                type="text"
                name="payout_details"
                placeholder={t('payoutDetailsPlaceholder')}
                required
                className="w-full rounded-lg border border-gray-200 px-4 py-2 text-sm"
              />
            </div>
            <button type="submit" className="btn-primary text-sm">
              {t('submitPayout')}
            </button>
          </form>
        ) : (
          <p className="mt-3 text-sm text-gray-400">{t('noBalance')}</p>
        )}

        <div className="mt-8">
          <h2 className="text-sm font-semibold text-sn-slate">{t('myPayouts')}</h2>
          <div className="mt-3 divide-y divide-gray-100 rounded-lg border border-gray-100">
            {(payouts ?? []).map((p) => (
              <div key={p.id} className="flex flex-wrap items-center justify-between gap-2 p-3 text-sm">
                <span className="font-semibold text-sn-teal">{formatFCFA(p.amount_fcfa)}</span>
                <span className="text-xs uppercase text-gray-400">{p.payout_method}</span>
                <span className="text-xs text-gray-400">{formatDate(p.requested_at)}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    p.status === 'completed'
                      ? 'bg-sn-teal/10 text-sn-teal'
                      : p.status === 'rejected'
                        ? 'bg-red-50 text-red-600'
                        : 'bg-amber-50 text-amber-700'
                  }`}
                >
                  {payoutStatusLabels[p.status]}
                </span>
              </div>
            ))}
            {!payouts?.length && (
              <p className="p-6 text-center text-sm text-gray-400">{t('noPayouts')}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
