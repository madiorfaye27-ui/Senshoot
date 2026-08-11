import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

export default async function GaleriesPage() {
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
    .select('*, galleries(*, photos(id))')
    .eq('photographer_id', photographer?.id);

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">Mes galeries</h1>
      <div className="mt-6 space-y-3">
        {(events ?? []).map((e: any) => {
          const gallery = e.galleries?.[0];
          return (
            <div key={e.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-4">
              <div>
                <p className="font-semibold text-sn-slate">{e.name}</p>
                <p className="text-xs text-gray-500">{gallery?.photos?.length ?? 0} photo(s)</p>
              </div>
              <Link
                href={`/dashboard/galeries/${gallery?.id}`}
                className="text-sm font-medium text-sn-orange"
              >
                Importer des photos →
              </Link>
            </div>
          );
        })}
        {!events?.length && (
          <p className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
            Créez d'abord un événement pour obtenir une galerie.
          </p>
        )}
      </div>
    </div>
  );
}
