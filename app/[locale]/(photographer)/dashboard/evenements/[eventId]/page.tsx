import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import PhotoUploader from '@/components/photographer/PhotoUploader';
import QRCode from 'qrcode';

export default async function EventManagePage({
  params,
}: {
  params: { eventId: string };
}) {
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
        {event.category?.replace('_', ' ')} · {event.status}
        {event.city ? ` · ${event.city}` : ''}
        {event.event_date ? ` · ${new Date(event.event_date).toLocaleDateString('fr-FR')}` : ''}
      </p>
      {event.description && (
        <p className="mt-3 max-w-2xl text-sm text-gray-600">{event.description}</p>
      )}

      {event.qr_code_url && (
        <div className="mt-6 flex items-center gap-4 rounded-xl border border-gray-100 p-4">
          <img src={event.qr_code_url} alt="QR Code" className="h-24 w-24" />
          <div>
            <p className="text-sm font-medium text-sn-slate">QR Code de l'événement</p>
            <p className="text-xs text-gray-500">
              Public, réutilisable par tous les invités — /galerie/{event.qr_short_code}
            </p>
          </div>
        </div>
      )}

      {gallery ? (
        <>
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-sn-slate">Photos</h2>
            <p className="mt-1 text-sm text-gray-500">
              {gallery.photos?.length ?? 0} photo(s) importée(s)
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
        <p className="mt-8 text-sm text-gray-400">Aucune galerie associée à cet événement.</p>
      )}

      <div className="mt-10 border-t border-gray-100 pt-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-sn-slate">Liens clients (sur place)</h2>
            <p className="mt-1 text-sm text-gray-500">
              Un lien/QR individuel à usage unique par client présent, pour
              l'emmener directement vers cette galerie.
            </p>
          </div>
          <form action={`/api/events/${event.id}/client-links`} method="post">
            <button type="submit" className="btn-primary text-sm">
              + Générer un lien client
            </button>
          </form>
        </div>

        <div className="mt-4 space-y-3">
          {clientLinks.map((link: any) => (
            <ClientLinkRow key={link.id} link={link} />
          ))}
          {!clientLinks.length && (
            <p className="rounded-lg border border-dashed border-gray-200 p-6 text-center text-sm text-gray-400">
              Aucun lien généré pour le moment.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

async function ClientLinkRow({ link }: { link: any }) {
  const url = `${process.env.NEXT_PUBLIC_APP_URL}/api/invite/${link.token}`;
  const qrDataUrl = !link.used_at ? await QRCode.toDataURL(url) : null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 p-3">
      {qrDataUrl ? (
        <img src={qrDataUrl} alt="QR client" className="h-16 w-16" />
      ) : (
        <div className="flex h-16 w-16 items-center justify-center rounded bg-gray-50 text-[10px] text-gray-400">
          Utilisé
        </div>
      )}
      <div className="flex-1">
        <p className="text-xs font-medium text-sn-slate">
          {link.used_at ? 'Lien utilisé' : 'Lien disponible'}
        </p>
        {!link.used_at && <p className="break-all text-xs text-gray-500">{url}</p>}
      </div>
    </div>
  );
}
