import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function PhotographesPage() {
  const t = await getTranslations('PhotographersPage');
  const supabase = createClient();
  const { data: photographers } = await supabase
    .from('photographers')
    .select('*')
    .eq('status', 'validated');

  return (
    <div className="container-sn py-16">
      <h1 className="text-3xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{t('subtitle')}</p>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {(photographers ?? []).map((p) => (
          <Link
            key={p.id}
            href={`/photographe/${p.slug}`}
            className="card-hover surface-card rounded-xl p-5 shadow-sm hover:border-sn-orange"
          >
            <p className="font-semibold text-sn-slate dark:text-white">{p.studio_name || t('defaultName')}</p>
            {p.city && <p className="mt-1 text-xs text-sn-teal">{p.city}</p>}
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{p.description}</p>
            {(p.contact_phone || p.contact_whatsapp) && (
              <p className="mt-3 text-xs font-medium text-sn-orange">
                {p.contact_whatsapp || p.contact_phone}
              </p>
            )}
          </Link>
        ))}
        {!photographers?.length && (
          <p className="col-span-full text-center text-gray-400">{t('empty')}</p>
        )}
      </div>
    </div>
  );
}
