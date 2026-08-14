import { getTranslations, getLocale } from 'next-intl/server';
import DashboardNav from '@/components/dashboard/DashboardNav';

function icon(children: React.ReactNode) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export default async function ClientDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('ClientDashboardLayout');
  const locale = await getLocale();

  const links = [
    {
      href: '/client/dashboard',
      label: t('navProfile'),
      icon: icon(
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      ),
    },
    {
      href: '/client/dashboard/commandes',
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
      href: '/client/dashboard/telechargements',
      label: t('navDownloads'),
      icon: icon(
        <>
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
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
