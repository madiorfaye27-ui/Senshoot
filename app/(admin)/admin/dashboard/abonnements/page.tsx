import { createAdminClient } from '@/lib/supabase/server';
import { formatFCFA, formatDate } from '@/lib/utils/format';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-sn-teal/10 text-sn-teal',
  past_due: 'bg-amber-50 text-amber-700',
  canceled: 'bg-gray-100 text-gray-500',
  suspended: 'bg-red-50 text-red-600',
  grace_period: 'bg-amber-50 text-amber-700',
};

export default async function AdminSubscriptionsPage() {
  const admin = createAdminClient();

  const { data: subscriptions } = await admin
    .from('subscriptions')
    .select('*, photographers(studio_name, slug), plans(name, price_fcfa)')
    .order('created_at', { ascending: false });

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">Abonnements</h1>

      <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-100">
        {(subscriptions ?? []).map((s: any) => (
          <div key={s.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <span className="text-sn-slate">{s.photographers?.studio_name || s.photographers?.slug}</span>
            <span className="font-medium text-sn-orange">{s.plans?.name}</span>
            <span className="text-gray-500">{formatFCFA(s.plans?.price_fcfa)}/mois</span>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[s.status] ?? ''}`}>
              {s.status}
            </span>
            <span className="text-xs text-gray-400">
              {s.expires_at ? `Expire le ${formatDate(s.expires_at)}` : 'Sans expiration'}
            </span>
          </div>
        ))}
        {!subscriptions?.length && (
          <p className="p-8 text-center text-sm text-gray-400">Aucun abonnement pour le moment.</p>
        )}
      </div>
    </div>
  );
}
