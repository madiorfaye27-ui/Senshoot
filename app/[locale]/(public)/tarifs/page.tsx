import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatFCFA } from '@/lib/utils/format';

export default async function TarifsPage() {
  const t = await getTranslations('PricingPage');
  const supabase = createClient();
  const { data: plans } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order');

  return (
    <div className="container-sn py-16">
      <h1 className="text-center text-3xl font-bold text-sn-slate dark:text-white">
        {t('title')}
      </h1>
      <div className="mt-10 grid gap-6 sm:grid-cols-3 lg:grid-cols-5">
        {(plans ?? []).map((plan) => (
          <div key={plan.id} className="card-hover surface-card rounded-2xl p-6 text-center shadow-sm">
            <p className="font-bold text-sn-teal">{plan.name}</p>
            <p className="mt-2 text-2xl font-extrabold text-sn-slate dark:text-white">
              {formatFCFA(plan.price_fcfa)}
              <span className="text-sm font-normal text-gray-400">{t('perMonth')}</span>
            </p>
            <ul className="mt-4 space-y-1 text-left text-xs text-gray-500 dark:text-gray-400">
              {plan.max_events && <li>{plan.max_events} {t('events')}</li>}
              {plan.max_storage_gb && <li>{plan.max_storage_gb} {t('storage')}</li>}
              {plan.max_photos && <li>{plan.max_photos} {t('photos')}</li>}
            </ul>
            <Link href="/register" className="btn-primary mt-6 w-full text-sm">
              {t('choose')}
            </Link>
          </div>
        ))}
        {!plans?.length && (
          <p className="col-span-full text-center text-gray-400">{t('comingSoon')}</p>
        )}
      </div>
    </div>
  );
}
