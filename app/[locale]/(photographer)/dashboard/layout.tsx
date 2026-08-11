import Link from 'next/link';

const links = [
  { href: '/dashboard', label: 'Vue d\'ensemble' },
  { href: '/dashboard/evenements', label: 'Événements' },
  { href: '/dashboard/galeries', label: 'Galeries' },
  { href: '/dashboard/ventes', label: 'Ventes & revenus' },
  { href: '/dashboard/profil', label: 'Mon profil public' },
  { href: '/dashboard/abonnement', label: 'Abonnement' },
];

export default function PhotographerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-gray-100 bg-white p-6">
        <p className="mb-6 text-lg font-bold text-sn-teal">Espace photographe</p>
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
