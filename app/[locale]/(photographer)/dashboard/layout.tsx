import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function PhotographerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('PhotographerDashboardLayout');
  const links = [
    { href: '/dashboard', label: t('navOverview') },
    { href: '/dashboard/evenements', label: t('navEvents') },
    { href: '/dashboard/galeries', label: t('navGalleries') },
    { href: '/dashboard/reservations', label: t('navReservations') },
    { href: '/dashboard/ventes', label: t('navSales') },
    { href: '/dashboard/profil', label: t('navProfile') },
    { href: '/dashboard/abonnement', label: t('navSubscription') },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-gray-100 bg-white p-6">
        <p className="mb-6 text-lg font-bold text-sn-teal">{t('title')}</p>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-sn-slate hover:bg-sn-teal/10 hover:text-sn-teal"
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="container-sn flex-1 py-8">{children}</main>
    </div>
  );
}
