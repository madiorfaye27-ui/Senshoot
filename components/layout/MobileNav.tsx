'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';

type NavLink = { href: string; label: string };

export default function MobileNav({
  navLinks,
  isLoggedIn,
  dashboardHref,
  locale,
}: {
  navLinks: NavLink[];
  isLoggedIn: boolean;
  dashboardHref: string;
  locale: string;
}) {
  const [open, setOpen] = useState(false);
  const t = useTranslations('Header');

  return (
    <div className="md:hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? t('closeMenu') : t('openMenu')}
        aria-expanded={open}
        className="flex h-9 w-9 items-center justify-center rounded-full text-sn-slate transition-colors hover:bg-sn-slate/10 dark:text-gray-300 dark:hover:bg-white/10"
      >
        {open ? (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        ) : (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 7h16M4 12h16M4 17h16" />
          </svg>
        )}
      </button>

      {open && (
        <nav className="absolute inset-x-0 top-16 z-50 border-b border-gray-100 bg-white px-4 py-4 shadow-lg dark:border-white/10 dark:bg-slate-900">
          <div className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-3 py-2 text-sm font-medium text-sn-slate hover:bg-sn-teal/10 hover:text-sn-orange dark:text-gray-300"
              >
                {link.label}
              </Link>
            ))}

            <div className="mt-2 flex flex-col gap-2 border-t border-gray-100 pt-3 dark:border-white/10">
              {isLoggedIn ? (
                <>
                  <Link
                    href={dashboardHref}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-sn-slate hover:bg-sn-teal/10 hover:text-sn-orange dark:text-gray-300"
                  >
                    {t('myDashboard')}
                  </Link>
                  <form action={`/api/auth/logout?locale=${locale}`} method="post">
                    <button type="submit" className="btn-primary w-full text-sm">
                      {t('logout')}
                    </button>
                  </form>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2 text-sm font-medium text-sn-slate hover:bg-sn-teal/10 hover:text-sn-orange dark:text-gray-300"
                  >
                    {t('login')}
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setOpen(false)}
                    className="btn-primary w-full text-center text-sm"
                  >
                    {t('iAmPhotographer')}
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      )}
    </div>
  );
}
