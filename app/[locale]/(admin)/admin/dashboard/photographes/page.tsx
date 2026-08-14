import { getTranslations } from 'next-intl/server';
import { createAdminClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400',
  validated: 'bg-sn-teal/10 text-sn-teal',
  rejected: 'bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400',
  suspended: 'bg-gray-100 text-gray-500 dark:bg-white/10 dark:text-gray-400',
};

export default async function AdminPhotographersPage() {
  const t = await getTranslations('AdminPhotographersPage');
  const admin = createAdminClient();

  const { data: photographers } = await admin
    .from('photographers')
    .select('*, profiles(first_name, last_name, phone)')
    .order('created_at', { ascending: false });

  const pending = (photographers ?? []).filter((p) => p.status === 'pending');
  const others = (photographers ?? []).filter((p) => p.status !== 'pending');

  const STATUS_LABELS: Record<string, string> = {
    pending: t('statusPending'),
    validated: t('statusValidated'),
    rejected: t('statusRejected'),
    suspended: t('statusSuspended'),
  };

  const labels = {
    defaultName: t('defaultName'),
    noPhone: t('noPhone'),
    registeredOn: (date: string) => t('registeredOn', { date }),
    validate: t('validate'),
    reject: t('reject'),
    suspend: t('suspend'),
    reactivate: t('reactivate'),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate dark:text-white">{t('title')}</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{t('intro')}</p>

      {!!pending.length && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold uppercase text-gray-400">
            {t('pendingHeading', { count: pending.length })}
          </h2>
          <div className="mt-3 space-y-3">
            {pending.map((p) => (
              <PhotographerRow key={p.id} photographer={p} statusLabels={STATUS_LABELS} labels={labels} />
            ))}
          </div>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-sm font-semibold uppercase text-gray-400">{t('allHeading')}</h2>
        <div className="mt-3 space-y-3">
          {others.map((p) => (
            <PhotographerRow key={p.id} photographer={p} statusLabels={STATUS_LABELS} labels={labels} />
          ))}
          {!photographers?.length && (
            <p className="rounded-lg border border-dashed border-gray-200 p-8 text-center text-sm text-gray-400">
              {t('empty')}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function PhotographerRow({
  photographer: p,
  statusLabels,
  labels,
}: {
  photographer: any;
  statusLabels: Record<string, string>;
  labels: {
    defaultName: string;
    noPhone: string;
    registeredOn: (date: string) => string;
    validate: string;
    reject: string;
    suspend: string;
    reactivate: string;
  };
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 p-4 dark:border-white/10">
      <div>
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sn-slate dark:text-white">
            {p.studio_name || `${p.profiles?.first_name ?? ''} ${p.profiles?.last_name ?? ''}`.trim() || labels.defaultName}
          </p>
          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[p.status]}`}>
            {statusLabels[p.status]}
          </span>
        </div>
        <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
          {p.profiles?.first_name} {p.profiles?.last_name} · {p.profiles?.phone || labels.noPhone} ·
          {' '}{labels.registeredOn(formatDate(p.created_at))}
        </p>
      </div>

      <div className="flex gap-2">
        {(p.status === 'pending' || p.status === 'rejected') && (
          <StatusForm photographerId={p.id} status="validated" label={labels.validate} className="btn-primary text-xs" />
        )}
        {p.status === 'pending' && (
          <StatusForm photographerId={p.id} status="rejected" label={labels.reject} className="btn-secondary text-xs" />
        )}
        {p.status === 'validated' && (
          <StatusForm photographerId={p.id} status="suspended" label={labels.suspend} className="btn-secondary text-xs" />
        )}
        {p.status === 'suspended' && (
          <StatusForm photographerId={p.id} status="validated" label={labels.reactivate} className="btn-primary text-xs" />
        )}
      </div>
    </div>
  );
}

function StatusForm({
  photographerId,
  status,
  label,
  className,
}: {
  photographerId: string;
  status: string;
  label: string;
  className: string;
}) {
  return (
    <form action={`/api/admin/photographers/${photographerId}/status`} method="post">
      <input type="hidden" name="status" value={status} />
      <button type="submit" className={className}>
        {label}
      </button>
    </form>
  );
}
