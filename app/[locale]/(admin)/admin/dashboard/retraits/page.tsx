import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { formatFCFA, formatDate } from '@/lib/utils/format';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  completed: 'bg-sn-teal/10 text-sn-teal',
  rejected: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
};

export default async function AdminPayoutsPage() {
  const t = await getTranslations('AdminPayoutsPage');
  const admin = createAdminClient();

  const { data: payouts } = await admin
    .from('payouts')
    .select('*, photographers(studio_name, slug)')
    .order('requested_at', { ascending: false });

  const statusLabels: Record<string, string> = {
    pending: t('statusPending'),
    completed: t('statusCompleted'),
    rejected: t('statusRejected'),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>

      <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-white/10 dark:border-white/10">
        {(payouts ?? []).map((p: any) => (
          <div key={p.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-semibold text-sn-slate dark:text-white">
                {p.photographers?.studio_name || p.photographers?.slug}
              </p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {p.payout_method} · {p.payout_details}
              </p>
              <p className="mt-1 text-xs text-gray-400">
                {p.status === 'pending'
                  ? t('requestedOn', { date: formatDate(p.requested_at) })
                  : t('processedOn', { date: formatDate(p.processed_at) })}
              </p>
            </div>

            <span className="font-bold text-sn-orange">{formatFCFA(p.amount_fcfa)}</span>

            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}>
              {statusLabels[p.status]}
            </span>

            {p.status === 'pending' && (
              <div className="flex gap-2">
                <form action={`/api/admin/payouts/${p.id}/status`} method="post">
                  <input type="hidden" name="status" value="completed" />
                  <button type="submit" className="btn-primary text-xs">
                    {t('markPaid')}
                  </button>
                </form>
                <form action={`/api/admin/payouts/${p.id}/status`} method="post">
                  <input type="hidden" name="status" value="rejected" />
                  <button type="submit" className="btn-secondary text-xs">
                    {t('reject')}
                  </button>
                </form>
              </div>
            )}
          </div>
        ))}
        {!payouts?.length && (
          <p className="p-8 text-center text-sm text-gray-400">{t('empty')}</p>
        )}
      </div>
    </div>
  );
}
