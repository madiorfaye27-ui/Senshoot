import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { formatFCFA, formatDate } from '@/lib/utils/format';

export default async function AbonnementPage({
  searchParams,
}: {
  searchParams: { success?: string };
}) {
  const t = await getTranslations('AbonnementPage');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('profile_id', user?.id)
    .single();

  const { data: subscription } = await supabase
    .from('subscriptions')
    .select('*, plans(*)')
    .eq('photographer_id', photographer?.id)
    .eq('status', 'active')
    .single();

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">{t('title')}</h1>

      {searchParams.success && (
        <p className="mt-4 max-w-md rounded-lg bg-sn-teal/10 p-3 text-sm text-sn-teal">
          {t('successActivated')}
        </p>
      )}

      {subscription ? (
        <div className="mt-6 max-w-md rounded-xl border border-gray-100 p-6 shadow-sm">
          <p className="font-bold text-sn-teal">{subscription.plans?.name}</p>
          <p className="mt-1 text-2xl font-extrabold">
            {formatFCFA(subscription.plans?.price_fcfa)}
            <span className="text-sm font-normal text-gray-400">{t('perMonth')}</span>
          </p>
          {subscription.expires_at && (
            <p className="mt-2 text-sm text-gray-500">
              {t('expiresOn', { date: formatDate(subscription.expires_at) })}
            </p>
          )}
        </div>
      ) : (
        <p className="mt-6 rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
          {t('noActive')}{' '}
          <Link href="/tarifs" className="font-medium text-sn-orange">{t('seePlans')}</Link>
        </p>
      )}
    </div>
  );
}
