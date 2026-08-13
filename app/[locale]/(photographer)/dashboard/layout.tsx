import { getTranslations, getLocale } from 'next-intl/server';
import DashboardNav from '@/components/photographer/DashboardNav';

function icon(children: React.ReactNode) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      {children}
    </svg>
  );
}

export default async function PhotographerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('PhotographerDashboardLayout');
  const locale = await getLocale();

  const links = [
    {
      href: '/dashboard',
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
      href: '/dashboard/evenements',
      label: t('navEvents'),
      icon: icon(
        <>
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
          <circle cx="12" cy="13" r="4" />
        </>
      ),
    },
    {
      href: '/dashboard/galeries',
      label: t('navGalleries'),
      icon: icon(
        <>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </>
      ),
    },
    {
      href: '/dashboard/reservations',
      label: t('navReservations'),
      icon: icon(
        <>
          <path d="M22 12h-6l-2 3h-4l-2-3H2" />
          <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
        </>
      ),
    },
    {
      href: '/dashboard/calendrier',
      label: t('navCalendar'),
      icon: icon(
        <>
          <rect x="3" y="4" width="18" height="18" rx="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </>
      ),
    },
    {
      href: '/dashboard/ventes',
      label: t('navSales'),
      icon: icon(
        <>
          <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
          <polyline points="17 6 23 6 23 12" />
        </>
      ),
    },
    {
      href: '/dashboard/profil',
      label: t('navProfile'),
      icon: icon(
        <>
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </>
      ),
    },
    {
      href: '/dashboard/abonnement',
      label: t('navSubscription'),
      icon: icon(
        <>
          <circle cx="12" cy="8" r="7" />
          <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
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
