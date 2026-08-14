import { getTranslations, getLocale } from 'next-intl/server';
import DashboardNav from '@/components/dashboard/DashboardNav';

function icon(children: React.ReactNode) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('AdminDashboardLayout');
  const locale = await getLocale();

  const links = [
    {
      href: '/admin/dashboard',
      label: t('navOverview'),
      icon: icon(
        <>
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
        </>
      ),
    },
    {
      href: '/admin/dashboard/utilisateurs',
      label: t('navUsers'),
      icon: icon(
        <>
          <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
          <circle cx="9" cy="7" r="4" />
          <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
          <path d="M16 3.13a4 4 0 0 1 0 7.75" />
        </>
      ),
    },
    {
      href: '/admin/dashboard/photographes',
      label: t('navPhotographers'),
      icon: icon(
        <>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </>
      ),
    },
    {
      href: '/admin/dashboard/commandes',
      label: t('navOrders'),
      icon: icon(
        <>
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
          <path d="M3 6h18" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </>
      ),
    },
    {
      href: '/admin/dashboard/abonnements',
      label: t('navSubscriptions'),
      icon: icon(
        <>
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
        </>
      ),
    },
    {
      href: '/admin/dashboard/retraits',
      label: t('navPayouts'),
      icon: icon(
        <>
          <line x1="12" y1="1" x2="12" y2="23" />
          <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
        </>
      ),
    },
  ];

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <DashboardNav title={t('title')} links={links} locale={locale} backToSiteLabel={t('backToSite')} />
      <main className="container-sn flex-1 py-8">{children}</main>
    </div>
  );
}
