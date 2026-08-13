import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { formatFCFA } from '@/lib/utils/format';

export default async function PhotographerDashboardPage() {
  const t = await getTranslations('PhotographerDashboardPage');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('*')
    .eq('profile_id', user?.id)
    .single();

  const stats = [
    { label: t('statEvents'), value: 0 },
    { label: t('statGalleries'), value: 0 },
    { label: t('statPhotos'), value: 0 },
    { label: t('statSales'), value: 0 },
    { label: t('statRevenue'), value: formatFCFA(0) },
    { label: t('statAvailableRevenue'), value: formatFCFA(0) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate dark:text-white">
        {t('welcome', { studioName: photographer?.studio_name ? `, ${photographer.studio_name}` : '' })}
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
        {t('accountStatus')}{' '}
        <span className="font-medium">{photographer?.status ?? t('statusPending')}</span>
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="card-hover surface-card rounded-xl p-5 shadow-sm">
            <p className="text-xs font-medium uppercase text-gray-400">{s.label}</p>
            <p className="mt-2 text-xl font-bold text-sn-teal">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
