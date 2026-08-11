import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function RegisterPage() {
  const t = await getTranslations('RegisterPage');
  return (
    <form action="/api/auth/register" method="post" className="space-y-4">
      <h1 className="text-center text-lg font-bold text-sn-slate dark:text-white">{t('title')}</h1>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate dark:text-gray-300">{t('firstName')}</label>
          <input
            type="text"
            name="first_name"
            required
            className="input-field"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate dark:text-gray-300">{t('lastName')}</label>
          <input
            type="text"
            name="last_name"
            required
            className="input-field"
          />
        </div>
      </div>

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
          minLength={8}
          className="input-field"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-sn-slate dark:text-gray-300">{t('registerAs')}</label>
        <select
          name="role"
          className="input-field"
        >
          <option value="client">{t('roleClient')}</option>
          <option value="photographer">{t('rolePhotographer')}</option>
        </select>
      </div>

      <label className="flex items-start gap-2 text-xs text-gray-500 dark:text-gray-400">
        <input type="checkbox" name="terms" required className="mt-0.5" />
        {t('acceptTerms')}
      </label>

      <button type="submit" className="btn-primary w-full">
        {t('submit')}
      </button>

      <p className="text-center text-sm text-gray-500 dark:text-gray-400">
        {t('alreadyRegistered')}{' '}
        <Link href="/login" className="font-medium text-sn-orange">
          {t('logIn')}
        </Link>
      </p>
    </form>
  );
}
