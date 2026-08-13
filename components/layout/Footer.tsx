import { getTranslations } from 'next-intl/server';
import { Link } from '@/i18n/navigation';

export default async function Footer() {
  const t = await getTranslations('Footer');

  const linkClass = 'hover:text-white transition-colors';

  return (
    <footer className="border-t border-gray-100 bg-sn-slate text-white">
      <div className="container-sn grid gap-8 py-12 md:grid-cols-4">
        <div>
          <p className="text-lg font-bold">
            Senshoot <span className="text-sn-orange">Sénégal</span>
          </p>
          <p className="mt-2 text-sm text-gray-300">{t('tagline')}</p>
        </div>

        <div>
          <p className="font-semibold">{t('platform')}</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li><Link href="/photographes" className={linkClass}>{t('photographers')}</Link></li>
            <li><Link href="/galeries" className={linkClass}>{t('galleries')}</Link></li>
            <li><Link href="/tarifs" className={linkClass}>{t('pricing')}</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">{t('company')}</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li><Link href="/a-propos" className={linkClass}>{t('about')}</Link></li>
            <li><Link href="/comment-ca-marche" className={linkClass}>{t('faq')}</Link></li>
            <li><Link href="/contact" className={linkClass}>{t('contact')}</Link></li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">{t('contact')}</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li>{t('location')}</li>
            <li>
              <a href="mailto:contact@shootsenegal.com" className={linkClass}>
                contact@shootsenegal.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4">
        <div className="container-sn flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-center text-xs text-gray-400">
          <span>© {new Date().getFullYear()} Senshoot Sénégal — {t('rights')}</span>
          <span aria-hidden="true">·</span>
          <Link href="/conditions-generales" className="hover:text-white transition-colors">
            {t('terms')}
          </Link>
        </div>
      </div>
    </footer>
  );
}
