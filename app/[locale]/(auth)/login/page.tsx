import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const t = await getTranslations('LoginPage');
  const locale = await getLocale();
  return (
    <form action="/api/auth/login" method="post" className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <h1 className="text-center text-lg font-bold text-sn-slate dark:text-white">{t('title')}</h1>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{searchParams.error}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-sn-slate dark:text-gray-300">{t('email')}</label>
        <input
          type="email"
          name="email"
          required
          className="input-field"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-sn-slate dark:text-gray-300">{t('password')}</label>
        <input
          type="password"
          name="password"
          required
          className="input-field"
        />
      </div>

      <button type="submit" className="btn-primary w-full">
        {t('submit')}
      </button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        {t('noAccount')}{' '}
        <Link href="/register" className="font-medium text-sn-orange">
          {t('signUp')}
        </Link>
      </p>
    </form>
  );
}
