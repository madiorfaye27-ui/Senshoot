'use client';

import { useLocale } from 'next-intl';
import { usePathname, useRouter } from '@/i18n/navigation';
import { useParams } from 'next/navigation';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const params = useParams();

  function switchTo(next: 'fr' | 'en') {
    router.replace(
      // @ts-expect-error — pathname est typé selon les routes connues de next-intl
      { pathname, params },
      { locale: next }
    );
  }

  return (
    <div className="flex items-center rounded-full border border-gray-200 text-xs font-medium dark:border-white/10">
      <button
        onClick={() => switchTo('fr')}
        className={`rounded-full px-2 py-1 transition-colors ${
          locale === 'fr' ? 'bg-sn-orange text-white' : 'text-sn-slate dark:text-gray-300'
        }`}
      >
        FR
      </button>
      <button
        onClick={() => switchTo('en')}
        className={`rounded-full px-2 py-1 transition-colors ${
          locale === 'en' ? 'bg-sn-orange text-white' : 'text-sn-slate dark:text-gray-300'
        }`}
      >
        EN
      </button>
    </div>
  );
}
