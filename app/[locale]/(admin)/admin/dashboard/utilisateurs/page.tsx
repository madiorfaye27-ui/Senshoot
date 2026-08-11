import { getTranslations, getLocale } from 'next-intl/server';
import { getPathname } from '@/i18n/navigation';
import { createAdminClient } from '@/lib/supabase/server';
import { formatDate } from '@/lib/utils/format';

const ROLE_STYLES: Record<string, string> = {
  client: 'bg-sn-teal/10 text-sn-teal',
  photographer: 'bg-sn-orange/10 text-sn-orange',
  admin: 'bg-sn-slate/10 text-sn-slate',
};

export default async function AdminUsersPage({
  searchParams,
}: {
  searchParams: { role?: string };
}) {
  const t = await getTranslations('AdminUsersPage');
  const locale = await getLocale();
  const basePath = getPathname({ href: '/admin/dashboard/utilisateurs', locale });
  const admin = createAdminClient();

  const [{ data: profiles }, { data: authUsers }] = await Promise.all([
    admin.from('profiles').select('*').order('created_at', { ascending: false }),
    admin.auth.admin.listUsers({ perPage: 1000 }),
  ]);

  const emailById = new Map(
    (authUsers?.users ?? []).map((u) => [u.id, u.email ?? ''])
  );

  const roleFilter = searchParams.role;
  const users = (profiles ?? []).filter((p) => !roleFilter || p.role === roleFilter);

  const ROLE_LABELS: Record<string, string> = {
    client: t('roleClient'),
    photographer: t('rolePhotographer'),
    admin: t('roleAdmin'),
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-sn-slate">{t('title')}</h1>

      <div className="mt-4 flex gap-2">
        {[
          { value: undefined, label: t('filterAll') },
          { value: 'client', label: t('filterClients') },
          { value: 'photographer', label: t('filterPhotographers') },
          { value: 'admin', label: t('filterAdmins') },
        ].map((f) => (
          <a
            key={f.label}
            href={f.value ? `${basePath}?role=${f.value}` : basePath}
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              roleFilter === f.value ? 'bg-sn-orange text-white' : 'bg-gray-100 text-gray-600'
            }`}
          >
            {f.label}
          </a>
        ))}
      </div>

      <div className="mt-6 divide-y divide-gray-100 rounded-lg border border-gray-100">
        {users.map((u) => (
          <div key={u.id} className="flex flex-wrap items-center justify-between gap-2 p-4 text-sm">
            <div>
              <p className="font-medium text-sn-slate">
                {u.first_name} {u.last_name}
              </p>
              <p className="text-xs text-gray-500">{emailById.get(u.id) || '—'}</p>
            </div>
            <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${ROLE_STYLES[u.role]}`}>
              {ROLE_LABELS[u.role] ?? u.role}
            </span>
            <span className="text-xs text-gray-500">{u.city || '—'}</span>
            <span className="text-xs text-gray-400">{t('registeredOn', { date: formatDate(u.created_at) })}</span>
          </div>
        ))}
        {!users.length && (
          <p className="p-8 text-center text-sm text-gray-400">{t('empty')}</p>
        )}
      </div>
    </div>
  );
}
