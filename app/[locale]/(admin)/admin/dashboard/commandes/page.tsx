import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { formatFCFA, formatDate } from '@/lib/utils/format';

const STATUS_STYLES: Record<string, string> = {
  en_attente: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  payee: 'bg-sn-teal/10 text-sn-teal',
  echouee: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  annulee: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
  remboursee: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
};

export default async function AdminOrdersPage() {
  const t = await getTranslations('AdminOrdersPage');
  const admin = createAdminClient();

  const { data: orders } = await admin
    .from('orders')
    .select('*, profiles(first_name, last_name), photographers(studio_name)')
    .order('created_at', { ascending: false })
    .limit(100);

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>

      <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-100 dark:divide-white/10 dark:border-white/10">
        {(orders ?? []).map((o: any) => (
          <div key={o.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <span className="font-mono text-gray-500 dark:text-gray-400">{o.order_number}</span>
            <span className="text-sn-slate dark:text-white">
              {o.profiles ? `${o.profiles.first_name} ${o.profiles.last_name}` : o.guest_email}
            </span>
            <span className="text-gray-500 dark:text-gray-400">{o.photographers?.studio_name || '—'}</span>
            <span className="font-semibold text-sn-teal">{formatFCFA(o.total_fcfa)}</span>
            <span className="text-xs uppercase text-gray-400">{o.payment_method}</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[o.status] ?? ''}`}>
              {o.status}
            </span>
            <span className="text-xs text-gray-400">{formatDate(o.created_at)}</span>
          </div>
        ))}
        {!orders?.length && (
          <p className="p-8 text-center text-sm text-gray-400">{t('empty')}</p>
        )}
      </div>
    </div>
  );
}
