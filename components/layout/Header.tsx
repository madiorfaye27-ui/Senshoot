import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import ThemeToggle from '@/components/ui/ThemeToggle';
import MobileNav from '@/components/layout/MobileNav';

const navLinks = [
  { href: '/galeries', label: 'Trouver ma galerie' },
  { href: '/photographes', label: 'Photographes' },
  { href: '/comment-ca-marche', label: 'Comment ça marche ?' },
  { href: '/tarifs', label: 'Tarifs' },
  { href: '/a-propos', label: 'À propos' },
  { href: '/contact', label: 'Contact' },
];

export default async function Header() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let dashboardHref = '/dashboard'; // photographe par défaut
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();
    if (profile?.role === 'admin') dashboardHref = '/admin/dashboard';
    else if (profile?.role === 'client') dashboardHref = '/client/dashboard';
    else dashboardHref = '/dashboard'; // photographe
  }

  return (
    <header className="relative border-b border-gray-100 bg-white transition-colors duration-200 dark:border-white/10 dark:bg-slate-900">
      <div className="container-sn flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center transition-transform hover:scale-105">
          <img src="/logo.png" alt="Senshoot Sénégal" className="h-10 w-auto" />
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-sn-slate transition-colors hover:text-sn-orange dark:text-gray-300 dark:hover:text-sn-orange"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link href={dashboardHref} className="text-sm font-medium text-sn-slate transition-colors hover:text-sn-orange dark:text-gray-300 dark:hover:text-sn-orange">
                  Mon tableau de bord
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button type="submit" className="btn-primary text-sm">
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-sn-slate transition-colors hover:text-sn-orange dark:text-gray-300 dark:hover:text-sn-orange">
                  Connexion
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  Je suis photographe
                </Link>
              </>
            )}
          </div>

          <MobileNav navLinks={navLinks} isLoggedIn={!!user} dashboardHref={dashboardHref} />
        </div>
      </div>
    </header>
  );
}
