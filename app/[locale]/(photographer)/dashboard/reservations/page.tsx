import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

const STATUS_STYLES: Record<string, string> = {
  en_attente: 'bg-amber-50 text-amber-700',
  contactee: 'bg-sn-teal/10 text-sn-teal',
  refusee: 'bg-red-50 text-red-600',
};

export default async function ReservationsPage() {
  const t = await getTranslations('PhotographerReservationsPage');
  const tc = await getTranslations('EventCategories');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: photographer } = await supabase
    .from('photographers')
    .select('id')
    .eq('profile_id', user?.id)
    .single();

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select('*')
    .eq('photographer_id', photographer?.id)
    .order('event_date', { ascending: true });

  const statusLabels: Record<string, string> = {
    en_attente: t('statusPending'),
    contactee: t('statusContacted'),
    refusee: t('statusDeclined'),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">{t('title')}</h1>

      <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-100">
        {(bookings ?? []).map((b) => (
          <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 p-4 text-sm">
            <div>
              <p className="font-semibold text-sn-slate">
                {b.client_name} — {t('forDate', { date: formatDate(b.event_date) })}
              </p>
              <p className="mt-1 text-xs text-gray-500">
                {b.event_category ? tc(b.event_category) : ''} · {b.client_email}
                {b.client_whatsapp ? ` · ${b.client_whatsapp}` : ''}
              </p>
              {b.message && <p className="mt-1 text-xs italic text-gray-400">« {b.message} »</p>}
              <p className="mt-1 text-xs text-gray-400">{t('requestedOn', { date: formatDate(b.created_at) })}</p>
            </div>

            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[b.status]}`}>
              {statusLabels[b.status]}
            </span>

            {b.status === 'en_attente' && (
              <div className="flex gap-2">
                <form action={`/api/photographers/booking-requests/${b.id}/status`} method="post">
                  <input type="hidden" name="status" value="contactee" />
                  <button type="submit" className="btn-primary text-xs">{t('markContacted')}</button>
                </form>
                <form action={`/api/photographers/booking-requests/${b.id}/status`} method="post">
                  <input type="hidden" name="status" value="refusee" />
                  <button type="submit" className="btn-secondary text-xs">{t('decline')}</button>
                </form>
              </div>
            )}
          </div>
        ))}
        {!bookings?.length && (
          <p className="p-8 text-center text-sm text-gray-400">{t('empty')}</p>
        )}
      </div>
    </div>
  );
}
