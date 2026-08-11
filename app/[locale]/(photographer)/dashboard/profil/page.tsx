import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

export default async function PhotographerProfilePage({
  searchParams,
}: {
  searchParams: { success?: string; error?: string };
}) {
  const t = await getTranslations('PhotographerProfilePage');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('*')
    .eq('profile_id', user?.id)
    .single();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-sn-slate">{t('title')}</h1>
      <p className="mt-1 text-sm text-gray-500">{t('intro')}</p>

      {searchParams.success && (
        <p className="mt-4 rounded-lg bg-sn-teal/10 p-3 text-sm text-sn-teal">
          {t('success')}
        </p>
      )}
      {searchParams.error && (
        <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-600">
          {searchParams.error}
        </p>
      )}

      <form action="/api/photographers/profile" method="post" className="mt-6 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">{t('studioName')}</label>
          <input
            name="studio_name"
            defaultValue={photographer?.studio_name ?? ''}
            className="w-full rounded-lg border border-gray-200 px-4 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">{t('description')}</label>
          <textarea
            name="description"
            rows={3}
            defaultValue={photographer?.description ?? ''}
            className="w-full rounded-lg border border-gray-200 px-4 py-2"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">{t('city')}</label>
          <input
            name="city"
            defaultValue={photographer?.city ?? ''}
            placeholder={t('cityPlaceholder')}
            className="w-full rounded-lg border border-gray-200 px-4 py-2"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium text-sn-slate">{t('phone')}</label>
            <input
              name="contact_phone"
              defaultValue={photographer?.contact_phone ?? ''}
              placeholder={t('phonePlaceholder')}
              className="w-full rounded-lg border border-gray-200 px-4 py-2"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-sn-slate">{t('whatsapp')}</label>
            <input
              name="contact_whatsapp"
              defaultValue={photographer?.contact_whatsapp ?? ''}
              placeholder={t('whatsappPlaceholder')}
              className="w-full rounded-lg border border-gray-200 px-4 py-2"
            />
          </div>
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-sn-slate">{t('email')}</label>
          <input
            name="contact_email"
            type="email"
            defaultValue={photographer?.contact_email ?? ''}
            className="w-full rounded-lg border border-gray-200 px-4 py-2"
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          {t('save')}
        </button>
      </form>
    </div>
  );
}
