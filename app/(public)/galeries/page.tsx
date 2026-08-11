import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { formatDate } from '@/lib/utils/format';

export default async function GalleriesSearchPage({
  searchParams,
}: {
  searchParams: { q?: string };
}) {
  const q = searchParams.q?.trim() ?? '';
  const supabase = createClient();

  let query = supabase
    .from('events')
    .select('id, name, city, event_date, cover_image_url, qr_short_code')
    .eq('visibility', 'public')
    .eq('status', 'publie')
    .order('created_at', { ascending: false })
    .limit(30);

  if (q) query = query.ilike('name', `%${q}%`);

  const { data: events } = await query;

  return (
    <div className="container-sn py-16">
      <h1 className="text-3xl font-bold text-sn-slate dark:text-white">Trouver ma galerie</h1>
      <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
        Recherchez l'événement par son nom pour retrouver vos photos.
      </p>

      <form className="mt-6 flex gap-2" action="/galeries" method="get">
        <input
          type="text"
          name="q"
          defaultValue={q}
          placeholder="Nom de l'événement (ex: Mariage Awa & Moussa)"
          className="w-full max-w-md rounded-lg border border-gray-200 px-4 py-2 dark:border-white/10 dark:bg-slate-800 dark:text-white"
        />
        <button type="submit" className="btn-primary text-sm">
          Rechercher
        </button>
      </form>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {(events ?? []).map((e) => (
          <Link
            key={e.id}
            href={`/galerie/${e.qr_short_code}`}
            className="card-hover surface-card overflow-hidden rounded-xl shadow-sm hover:border-sn-orange"
          >
            {e.cover_image_url && (
              <img src={e.cover_image_url} alt={e.name} className="aspect-video w-full object-cover" />
            )}
            <div className="p-4">
              <p className="font-semibold text-sn-slate dark:text-white">{e.name}</p>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {e.city}
                {e.event_date ? ` · ${formatDate(e.event_date)}` : ''}
              </p>
            </div>
          </Link>
        ))}
        {!events?.length && (
          <p className="col-span-full rounded-lg border border-dashed border-gray-200 p-10 text-center text-sm text-gray-400 dark:border-white/10">
            {q
              ? `Aucun événement trouvé pour "${q}".`
              : 'Aucun événement publié pour le moment.'}
          </p>
        )}
      </div>
    </div>
  );
}
