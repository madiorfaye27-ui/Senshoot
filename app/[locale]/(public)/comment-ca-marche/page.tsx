import { getTranslations } from 'next-intl/server';

export default async function CommentCaMarchePage() {
  const t = await getTranslations('HowItWorksPage');
  const steps = [1, 2, 3, 4, 5, 6].map((n) => ({
    title: t(`step${n}Title` as 'step1Title'),
    text: t(`step${n}Text` as 'step1Text'),
  }));

  return (
    <div className="container-sn py-16">
      <h1 className="text-center text-3xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>
      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {steps.map((s, i) => (
          <div key={s.title} className="surface-card rounded-xl p-6 shadow-sm">
            <div className="mb-3 flex h-8 w-8 items-center justify-center rounded-full bg-sn-orange font-bold text-white">
              {i + 1}
            </div>
            <p className="font-semibold text-sn-slate dark:text-white">{s.title}</p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{s.text}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
