import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

export default async function ClientProfilePage() {
  const t = await getTranslations('ClientProfilePage');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user?.id)
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate dark:text-white">
        {t('greeting', { name: profile?.first_name ?? '' })}
      </h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>

      <div className="surface-card mt-8 rounded-xl p-6">
        <p className="font-semibold text-sn-slate dark:text-white">{t('tip')}</p>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('tipText')}</p>
      </div>
    </div>
  );
}
