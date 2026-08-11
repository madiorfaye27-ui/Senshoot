import { createClient } from '@/lib/supabase/server';
import { formatFCFA } from '@/lib/utils/format';

export default async function PhotographerDashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('*')
    .eq('profile_id', user?.id)
    .single();

  const stats = [
    { label: 'Événements', value: 0 },
    { label: 'Galeries', value: 0 },
    { label: 'Photos', value: 0 },
    { label: 'Ventes', value: 0 },
    { label: 'Chiffre d\'affaires', value: formatFCFA(0) },
    { label: 'Revenus disponibles', value: formatFCFA(0) },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">
        Bienvenue{photographer?.studio_name ? `, ${photographer.studio_name}` : ''}
      </h1>
      <p className="mt-1 text-sm text-gray-500">
        Statut du compte :{' '}
        <span className="font-medium">{photographer?.status ?? 'en attente'}</span>
      </p>

      <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3">
        {stats.map((s) => (
          <div key={s.label} className="rounded-xl border border-gray-100 p-5 shadow-sm">
            <p className="text-xs font-medium uppercase text-gray-400">{s.label}</p>
            <p className="mt-2 text-xl font-bold text-sn-teal">{s.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
