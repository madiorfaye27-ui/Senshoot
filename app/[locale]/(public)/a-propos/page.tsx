import { getTranslations } from 'next-intl/server';

export default async function AProposPage() {
  const t = await getTranslations('AboutPage');
  return (
    <div className="container-sn py-16">
      <h1 className="text-3xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>
      <p className="mt-4 max-w-2xl text-gray-600 dark:text-gray-400">{t('text')}</p>
    </div>
  );
}
