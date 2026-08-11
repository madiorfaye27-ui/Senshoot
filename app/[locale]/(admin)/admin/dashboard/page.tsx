import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/server';

export default async function AdminDashboardPage() {
  const t = await getTranslations('AdminDashboardPage');
  const supabase = createAdminClient();

  const [{ count: users }, { count: photographers }, { count: orders }] = await Promise.all([
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('photographers').select('*', { count: 'exact', head: true }),
    supabase.from('orders').select('*', { count: 'exact', head: true }),
  ]);

  const stats = [
    { label: t('statUsers'), value: users ?? 0 },
    { label: t('statPhotographers'), value: photographers ?? 0 },
    { label: t('statOrders'), value: orders ?? 0 },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">{t('title')}</h1>
      <div className="mt-8 grid grid-cols-3 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 p-6 shadow-sm">
            <p className="text-xs font-medium uppercase text-gray-400">{s.label}</p>
            <p className="mt-2 text-2xl font-bold text-sn-teal">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
