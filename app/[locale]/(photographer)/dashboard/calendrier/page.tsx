import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';
import { getMonthGrid, toDateKey } from '@/lib/utils/calendar';

const WEEKDAY_KEYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;

function monthParamOf(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { month?: string };
}) {
  const t = await getTranslations('PhotographerCalendarPage');
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

  const now = new Date();
  const [yearParam, monthParam] = (searchParams.month ?? '').split('-').map(Number);
  const year = yearParam && monthParam ? yearParam : now.getUTCFullYear();
  const month = yearParam && monthParam ? monthParam : now.getUTCMonth() + 1;

  const monthStart = `${year}-${String(month).padStart(2, '0')}-01`;
  const monthEnd = toDateKey(new Date(Date.UTC(year, month, 0)));

  const { data: bookings } = await supabase
    .from('booking_requests')
    .select('event_date, client_name, event_category')
    .eq('photographer_id', photographer?.id)
    .eq('status', 'confirmee')
    .gte('event_date', monthStart)
    .lte('event_date', monthEnd);

  const bookingsByDate = new Map<string, NonNullable<typeof bookings>>();
  (bookings ?? []).forEach((b) => {
    const list = bookingsByDate.get(b.event_date) ?? [];
    list.push(b);
    bookingsByDate.set(b.event_date, list);
  });

  const weeks = getMonthGrid(year, month);
  const prevMonthParam = monthParamOf(new Date(Date.UTC(year, month - 2, 1)));
  const nextMonthParam = monthParamOf(new Date(Date.UTC(year, month, 1)));
  const monthLabel = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric' }).format(
    new Date(Date.UTC(year, month - 1, 1))
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>
        <div className="flex items-center gap-3">
          <Link href={`/dashboard/calendrier?month=${prevMonthParam}`} className="btn-secondary text-xs">
            ←
          </Link>
          <p className="min-w-[9rem] text-center text-sm font-medium capitalize text-sn-slate dark:text-white">
            {monthLabel}
          </p>
          <Link href={`/dashboard/calendrier?month=${nextMonthParam}`} className="btn-secondary text-xs">
            →
          </Link>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-400">
        {WEEKDAY_KEYS.map((k) => (
          <div key={k}>{t(`weekday_${k}`)}</div>
        ))}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {weeks.flat().map(({ date, inMonth }) => {
          const key = toDateKey(date);
          const dayBookings = bookingsByDate.get(key) ?? [];
          return (
            <div
              key={key}
              className={`min-h-[80px] rounded-lg border p-2 text-xs ${
                inMonth ? 'border-gray-100 dark:border-white/10' : 'border-transparent opacity-30'
              } ${dayBookings.length ? 'bg-sn-teal/10' : ''}`}
            >
              <p
                className={`font-medium ${
                  dayBookings.length ? 'text-sn-teal' : 'text-sn-slate dark:text-gray-300'
                }`}
              >
                {date.getUTCDate()}
              </p>
              {dayBookings.map((b, i) => (
                <p
                  key={i}
                  className="mt-1 truncate text-[11px] text-sn-teal"
                  title={`${b.client_name}${b.event_category ? ` — ${tc(b.event_category)}` : ''}`}
                >
                  {b.client_name}
                </p>
              ))}
            </div>
          );
        })}
      </div>

      {!bookings?.length && <p className="mt-6 text-center text-sm text-gray-400">{t('emptyMonth')}</p>}
    </div>
  );
}
