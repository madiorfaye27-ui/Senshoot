import { getTranslations } from 'next-intl/server';

export default async function ContactPage() {
  const t = await getTranslations('ContactPage');
  return (
    <div className="container-sn py-16">
      <h1 className="text-3xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>
      <div className="mt-6 space-y-2 text-gray-600 dark:text-gray-400">
        <p>Dakar, Sénégal</p>
        <p>contact@shootsenegal.com</p>
      </div>
      <form className="mt-8 max-w-lg space-y-4">
        <input placeholder={t('namePlaceholder')} className="input-field" />
        <input placeholder={t('emailPlaceholder')} type="email" className="input-field" />
        <textarea placeholder={t('messagePlaceholder')} rows={4} className="input-field" />
        <button type="submit" className="btn-primary">{t('send')}</button>
      </form>
    </div>
  );
}
