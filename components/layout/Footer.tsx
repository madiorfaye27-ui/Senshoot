import { getTranslations } from 'next-intl/server';

export default async function Footer() {
  const t = await getTranslations('Footer');

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
            <li>{t('photographers')}</li>
            <li>{t('galleries')}</li>
            <li>{t('pricing')}</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">{t('company')}</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li>{t('about')}</li>
            <li>{t('faq')}</li>
            <li>{t('contact')}</li>
          </ul>
        </div>

        <div>
          <p className="font-semibold">{t('contact')}</p>
          <ul className="mt-2 space-y-1 text-sm text-gray-300">
            <li>{t('location')}</li>
            <li>contact@shootsenegal.com</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10 py-4 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Senshoot Sénégal — {t('rights')}
      </div>
    </footer>
  );
}
