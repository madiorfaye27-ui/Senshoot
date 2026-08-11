import { getTranslations } from 'next-intl/server';

const categories = [
  'mariage', 'bapteme', 'anniversaire', 'conference', 'concert', 'festival',
  'sport', 'professionnel', 'remise_diplomes', 'scolaire', 'institutionnel',
  'shooting', 'autre',
] as const;

export default async function NewEventPage() {
  const t = await getTranslations('NewEventPage');
  const tc = await getTranslations('EventCategories');

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-sn-slate">{t('title')}</h1>

      <form action="/api/events" method="post" className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">{t('nameLabel')}</label>
          <input name="name" required className="w-full rounded-lg border border-gray-200 px-4 py-2" />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">{t('descriptionLabel')}</label>
          <textarea name="description" rows={3} className="w-full rounded-lg border border-gray-200 px-4 py-2" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-sn-slate">{t('dateLabel')}</label>
            <input type="date" name="event_date" className="w-full rounded-lg border border-gray-200 px-4 py-2" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sn-slate">{t('cityLabel')}</label>
            <input name="city" className="w-full rounded-lg border border-gray-200 px-4 py-2" />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">{t('categoryLabel')}</label>
          <select name="category" className="w-full rounded-lg border border-gray-200 px-4 py-2">
            {categories.map((c) => (
              <option key={c} value={c}>{tc(c)}</option>
            ))}
          </select>
        </div>

        <button type="submit" className="btn-primary w-full">
          {t('submit')}
        </button>
      </form>
    </div>
  );
}
