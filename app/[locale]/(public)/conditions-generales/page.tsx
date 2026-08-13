import { getTranslations } from 'next-intl/server';

type Section = { heading: string; body: string };

export default async function TermsPage() {
  const t = await getTranslations('TermsPage');
  const sections = t.raw('sections') as Section[];

  return (
    <div className="container-sn max-w-2xl py-16">
      <h1 className="text-3xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>
      <p className="mt-2 text-sm text-gray-400">{t('lastUpdated')}</p>

      <div className="mt-8 space-y-6">
        {sections.map((section) => (
          <div key={section.heading}>
            <h2 className="text-lg font-semibold text-sn-slate dark:text-white">{section.heading}</h2>
            <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-400">{section.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
