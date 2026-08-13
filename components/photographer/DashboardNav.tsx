'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { usePathname, Link } from '@/i18n/navigation';
import ThemeToggle from '@/components/ui/ThemeToggle';
import LanguageSwitcher from '@/components/layout/LanguageSwitcher';

type NavLink = { href: string; label: string; icon: React.ReactNode };

export default function DashboardNav({
  title,
  links,
  locale,
  backToSiteLabel,
}: {
  title: string;
  links: NavLink[];
  locale: string;
  backToSiteLabel: string;
}) {
  const t = useTranslations('Header');
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const navItems = (
    <div className="space-y-1">
      {links.map((link) => {
        const active = pathname === link.href;
        return (
          <Link
            key={link.href}
            href={link.href}
            onClick={() => setOpen(false)}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-200 ${
              active
                ? 'bg-sn-teal text-white shadow-sm'
                : 'text-sn-slate hover:bg-sn-teal/10 hover:text-sn-teal dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white'
            }`}
          >
            <span className={active ? 'text-white' : 'text-sn-teal'}>{link.icon}</span>
            {link.label}
          </Link>
        );
      })}
    </div>
  );

  const footer = (
    <div className="mt-4 space-y-3 border-t border-gray-100 pt-4 dark:border-white/10">
      <div className="flex items-center justify-between px-1">
        <LanguageSwitcher />
        <ThemeToggle />
      </div>
      <Link
        href="/"
        onClick={() => setOpen(false)}
        className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-sn-slate transition-colors hover:bg-sn-teal/10 hover:text-sn-teal dark:text-gray-300 dark:hover:bg-white/10"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        {backToSiteLabel}
      </Link>
      <form action={`/api/auth/logout?locale=${locale}`} method="post">
        <button type="submit" className="btn-secondary w-full text-sm">
          {t('logout')}
        </button>
      </form>
    </div>
  );

  return (
    <>
      {/* Barre mobile : titre + bouton menu, panneau déroulant en dessous */}
      <div className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 dark:border-white/10 dark:bg-slate-900 md:hidden">
        <div className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-sn-teal text-white">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
          <p className="text-base font-bold text-sn-slate dark:text-white">{title}</p>
        </div>
        <button
          onClick={() => setOpen((o) => !o)}
          aria-label={open ? t('closeMenu') : t('openMenu')}
          aria-expanded={open}
          className="flex h-9 w-9 items-center justify-center rounded-full text-sn-slate transition-colors hover:bg-sn-slate/10 dark:text-gray-300 dark:hover:bg-white/10"
        >
          {open ? (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          ) : (
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          )}
        </button>
      </div>
      {open && (
        <nav className="border-b border-gray-100 bg-white px-4 py-4 shadow-lg dark:border-white/10 dark:bg-slate-900 md:hidden">
          {navItems}
          {footer}
        </nav>
      )}

      {/* Sidebar desktop, fixée sur toute la hauteur de l'écran */}
      <aside className="hidden shrink-0 border-r border-gray-100 bg-white p-6 dark:border-white/10 dark:bg-slate-900 md:sticky md:top-0 md:flex md:h-screen md:w-64 md:flex-col md:overflow-y-auto">
        <div className="mb-6 flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-sn-teal text-white">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="4" />
            </svg>
          </span>
          <p className="text-lg font-bold text-sn-slate dark:text-white">{title}</p>
        </div>
        <nav className="flex-1">{navItems}</nav>
        {footer}
      </aside>
    </>
  );
}
