import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';

export default async function GaleriesPage() {
  const t = await getTranslations('GaleriesPage');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('profile_id', user?.id)
    .single();

  const { data: events } = await supabase
    .from('events')
    .select('*, galleries(*, photos(id))')
    .eq('photographer_id', photographer?.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>
      <div className="mt-6 space-y-3">
        {(events ?? []).map((e: any) => {
          const gallery = e.galleries?.[0];
          return (
            <div key={e.id} className="card-hover surface-card flex items-center justify-between rounded-lg p-4">
              <div>
                <p className="font-semibold text-sn-slate dark:text-white">{e.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('photosCount', { count: gallery?.photos?.length ?? 0 })}</p>
              </div>
              <Link
                href={`/dashboard/galeries/${gallery?.id}`}
                className="text-sm font-medium text-sn-orange"
              >
                {t('importPhotos')}
              </Link>
            </div>
          );
        })}
        {!events?.length && (
          <p className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-white/10">
            {t('empty')}
          </p>
        )}
      </div>
    </div>
  );
}
