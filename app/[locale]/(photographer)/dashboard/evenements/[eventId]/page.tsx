import { getTranslations, getLocale } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PhotoUploader from '@/components/photographer/PhotoUploader';
import QRCode from 'qrcode';

export default async function EventManagePage({
  params,
}: {
  params: { eventId: string };
}) {
  const t = await getTranslations('EventManagePage');
  const tc = await getTranslations('EventCategories');
  const locale = await getLocale();
  const supabase = createClient();

  const { data: event } = await supabase
    .from('events')
    .select('*, galleries(*, photos(*)), event_client_links(*)')
    .eq('id', params.eventId)
    .single();

  if (!event) return notFound();

  const gallery = event.galleries?.[0];
  const clientLinks = (event.event_client_links ?? []).sort(
    (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">{event.name}</h1>
      <p className="mt-1 text-sm text-gray-500">
        {event.category ? tc(event.category) : ''} · {event.status}
        {event.city ? ` · ${event.city}` : ''}
        {event.event_date ? ` · ${new Date(event.event_date).toLocaleDateString(locale === 'en' ? 'en-US' : 'fr-FR')}` : ''}
      </p>
      {event.description && (
        <p className="mt-3 max-w-2xl text-sm text-gray-600">{event.description}</p>
      )}

      {event.qr_code_url && (
        <div className="mt-6 flex items-center gap-4 rounded-xl border border-gray-100 p-4">
          <img src={event.qr_code_url} alt={t('qrCodeAlt')} className="h-24 w-24" />
          <div>
            <p className="text-sm font-medium text-sn-slate">{t('qrCodeTitle')}</p>
            <p className="text-xs text-gray-500">
              {t('qrCodeDesc', { code: event.qr_short_code })}
            </p>
          </div>
        </div>
      )}

      {gallery ? (
        <>
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-sn-slate">{t('photosTitle')}</h2>
            <p className="mt-1 text-sm text-gray-500">
              {t('photosImported', { count: gallery.photos?.length ?? 0 })}
            </p>
            <div className="mt-4">
              <PhotoUploader galleryId={gallery.id} />
            </div>
          </div>

          <div className="mt-8 grid grid-cols-3 gap-3 sm:grid-cols-5">
            {(gallery.photos ?? []).map((p: any) => (
              <img
                key={p.id}
                src={p.thumbnail_url}
                className="aspect-square rounded-lg object-cover"
                alt={p.photo_number}
              />
            ))}
          </div>
        </>
      ) : (
        <p className="mt-8 text-sm text-gray-400">{t('noGallery')}</p>
      )}

      <div className="mt-10 border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-sn-slate">{t('clientLinksTitle')}</h2>
            <p className="mt-1 text-sm text-gray-500">{t('clientLinksDesc')}</p>
          </div>
          <form action={`/api/events/${event.id}/client-links`} method="post">
            <button type="submit" className="btn-primary text-sm">
              {t('generateLink')}
            </button>
          </form>
        </div>

        <div className="mt-4 space-y-3">
          {clientLinks.map((link: any) => (
            <ClientLinkRow
              key={link.id}
              link={link}
              linkUsed={t('linkUsed')}
              linkAvailable={t('linkAvailable')}
              usedShort={t('usedShort')}
              clientQrAlt={t('clientQrAlt')}
            />
          ))}
          {!clientLinks.length && (
            <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
              {t('noLinks')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

async function ClientLinkRow({
  link,
  linkUsed,
  linkAvailable,
  usedShort,
  clientQrAlt,
}: {
  link: any;
  linkUsed: string;
  linkAvailable: string;
  usedShort: string;
  clientQrAlt: string;
}) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/invite/${link.token}`;
  const qrDataUrl = !link.used_at ? await QRCode.toDataURL(url) : null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3">
      {qrDataUrl ? (
        <img src={qrDataUrl} alt={clientQrAlt} className="h-16 w-16" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-50 text-[10px] text-gray-400">
          {usedShort}
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs font-medium text-sn-slate">
          {link.used_at ? linkUsed : linkAvailable}
        </p>
        {!link.used_at && <p className="break-all text-xs text-gray-500">{url}</p>}
      </div>
    </div>
  );
}
