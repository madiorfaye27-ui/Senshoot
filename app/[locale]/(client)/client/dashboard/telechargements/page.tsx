import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';

export default async function ClientDownloadsPage() {
  const t = await getTranslations('ClientDownloadsPage');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_items(*, photos(*))')
    .eq('client_id', user?.id)
    .eq('status', 'payee');

  const items = (orders ?? []).flatMap((o: any) => o.order_items ?? []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">{t('title')}</h1>
      <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
        {items.map((item: any) => (
          <a
            key={item.id}
            href={`/api/downloads/${item.id}`}
            className="overflow-hidden rounded-xl border border-gray-100 shadow-sm"
          >
            <img src={item.photos?.thumbnail_url} className="aspect-square w-full object-cover" alt="" />
            <p className="p-2 text-center text-xs font-medium text-sn-orange">{t('downloadHQ')}</p>
          </a>
        ))}
        {!items.length && (
          <p className="col-span-full text-center text-sm text-gray-400">{t('empty')}</p>
        )}
      </div>
    </div>
  );
}
