import Link from 'next/link';

const links = [
  { href: '/admin/dashboard', label: 'Vue d\'ensemble' },
  { href: '/admin/dashboard/utilisateurs', label: 'Utilisateurs' },
  { href: '/admin/dashboard/photographes', label: 'Photographes' },
  { href: '/admin/dashboard/commandes', label: 'Commandes & paiements' },
  { href: '/admin/dashboard/abonnements', label: 'Abonnements' },
];

export default function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <aside className="w-64 shrink-0 border-r border-gray-100 bg-sn-slate p-6 text-white">
        <p className="mb-6 text-lg font-bold">Administration</p>
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
