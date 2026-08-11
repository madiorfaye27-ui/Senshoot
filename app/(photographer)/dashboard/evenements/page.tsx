import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function EventsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('profile_id', user?.id)
    .single();

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('photographer_id', photographer?.id)
    .order('created_at', { ascending: false });

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-sn-slate">Mes événements</h1>
        <Link href="/dashboard/evenements/nouveau" className="btn-primary text-sm">
          + Nouvel événement
        </Link>
      </div>

      <div className="mt-6 space-y-3">
        {events?.length ? (
          events.map((e) => (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
              <div>
                <p className="font-semibold text-sn-slate">{e.name}</p>
                <p className="text-xs text-gray-500">{e.category} · {e.status}</p>
              </div>
              <Link href={`/dashboard/evenements/${e.id}`} className="text-sm font-medium text-sn-orange">
                Gérer →
              </Link>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            Aucun événement pour le moment. Créez votre premier événement pour générer un QR Code.
          </p>
        )}
      </div>
    </div>
  );
}
