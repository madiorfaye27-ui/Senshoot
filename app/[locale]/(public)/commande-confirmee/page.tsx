import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function OrderConfirmedPage() {
  const t = await getTranslations('OrderConfirmedPage');

  return (
    <div className="container-sn flex min-h-[60vh] flex-col items-center justify-center text-center">
      <div className="text-4xl">✅</div>
      <h1 className="mt-4 text-xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>
      <p className="mt-2 max-w-md text-sm text-gray-500 dark:text-gray-400">{t('text')}</p>
      <Link href="/" className="btn-primary mt-6 text-sm">
        {t('backHome')}
      </Link>
    </div>
  );
}
