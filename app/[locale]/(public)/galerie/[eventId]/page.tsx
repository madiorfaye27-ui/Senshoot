import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import GalleryCart from '@/components/gallery/GalleryCart';

export default async function GalleryPage({
  params,
}: {
  params: { eventId: string };
}) {
  const t = await getTranslations('PublicGalleryPage');
  const supabase = createClient();

  const { data: event } = await supabase
    .from('events')
    .select('*, galleries(*, photos(*))')
    .eq('qr_short_code', params.eventId)
    .single();

  if (!event) return notFound();

  const gallery = event.galleries?.[0];
  const photos = gallery?.photos ?? [];

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-sn-slate/5 py-10 dark:bg-slate-900">
      <div className="container-sn">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-sn-slate dark:text-white">{event.name}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {event.city} {event.event_date ? `· ${event.event_date}` : ''}
          </p>
        </div>

        {photos.length ? (
          <GalleryCart photos={photos} eventId={event.id} isLoggedIn={!!user} />
        ) : (
          <p className="rounded-lg border border-dashed border-gray-300 bg-white p-10 text-center text-gray-400 dark:border-white/10 dark:bg-slate-800">
            {t('comingSoon')}
          </p>
        )}
      </div>
    </div>
  );
}
