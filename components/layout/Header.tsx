import { Link } from '@/i18n/navigation';
import { getTranslations } from 'next-intl/server';
import { createClient } from '@/lib/supabase/server';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';
import MobileNav from '@/components/layout/MobileNav';

export default async function Header() {
  const t = await getTranslations('Header');
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const navLinks = [
    { href: '/galeries', label: t('findGallery') },
    { href: '/photographes', label: t('photographers') },
    { href: '/comment-ca-marche', label: t('howItWorks') },
    { href: '/tarifs', label: t('pricing') },
    { href: '/a-propos', label: t('about') },
    { href: '/contact', label: t('contact') },
  ];

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
          <LanguageSwitcher />
          <ThemeToggle />

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <>
                <Link href={dashboardHref} className="text-sm font-medium text-sn-slate transition-colors hover:text-sn-orange dark:text-gray-300 dark:hover:text-sn-orange">
                  {t('myDashboard')}
                </Link>
                <form action="/api/auth/logout" method="post">
                  <button type="submit" className="btn-primary text-sm">
                    {t('logout')}
                  </button>
                </form>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm font-medium text-sn-slate transition-colors hover:text-sn-orange dark:text-gray-300 dark:hover:text-sn-orange">
                  {t('login')}
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  {t('iAmPhotographer')}
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
