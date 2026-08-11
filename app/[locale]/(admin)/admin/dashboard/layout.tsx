import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = await getTranslations('AdminDashboardLayout');
  const links = [
    { href: '/admin/dashboard', label: t('navOverview') },
    { href: '/admin/dashboard/utilisateurs', label: t('navUsers') },
    { href: '/admin/dashboard/photographes', label: t('navPhotographers') },
    { href: '/admin/dashboard/commandes', label: t('navOrders') },
    { href: '/admin/dashboard/abonnements', label: t('navSubscriptions') },
    { href: '/admin/dashboard/retraits', label: t('navPayouts') },
  ];

  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-gray-100 bg-sn-slate p-6 text-white">
        <p className="mb-6 text-lg font-bold">{t('title')}</p>
        <nav className="space-y-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-white/10"
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
