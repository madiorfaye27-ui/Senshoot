import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { Link } from '@/i18n/navigation';

export default async function EventsPage() {
  const t = await getTranslations('EventsPage');
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
    .select('*')
    .eq('photographer_id', photographer?.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>
        <Link href="/dashboard/evenements/nouveau" className="btn-primary text-sm">
          {t('newEvent')}
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {events?.length ? (
          events.map((e) => (
            <div key={e.id} className="card-hover surface-card flex items-center justify-between rounded-lg p-4">
              <div>
                <p className="font-semibold text-sn-slate dark:text-white">{e.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{e.category} · {e.status}</p>
              </div>
              <Link href={`/dashboard/evenements/${e.id}`} className="text-sm font-medium text-sn-orange">
                {t('manage')}
              </Link>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400 dark:border-white/10">
            {t('empty')}
          </p>
        )}
      </div>
    </div>
  );
}
