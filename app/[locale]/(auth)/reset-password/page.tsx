import { getTranslations, getLocale } from 'next-intl/server';
import { Link } from '@/i18n/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const t = await getTranslations('ResetPasswordPage');
  const locale = await getLocale();

  // On n'arrive ici qu'après /api/auth/callback, qui a échangé le code
  // reçu par email contre une session de récupération. Sans session
  // valide (lien déjà utilisé, expiré, ou page visitée directement),
  // impossible de changer le mot de passe — on l'explique plutôt que
  // d'afficher un formulaire qui échouera silencieusement.
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="space-y-4 text-center">
        <h1 className="text-lg font-bold text-sn-slate dark:text-white">{t('title')}</h1>
        <p className="text-sm text-red-600">{t('invalidLink')}</p>
        <Link href="/forgot-password" className="font-medium text-sn-orange">
          {t('requestNewLink')}
        </Link>
      </div>
    );
  }

  return (
    <form action="/api/auth/reset-password" method="post" className="space-y-4">
      <input type="hidden" name="locale" value={locale} />
      <h1 className="text-center text-lg font-bold text-sn-slate dark:text-white">{t('title')}</h1>

      {searchParams.error && (
        <p className="rounded-lg bg-red-50 p-3 text-sm text-red-600">{searchParams.error}</p>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-sn-slate dark:text-gray-300">{t('password')}</label>
        <input type="password" name="password" required minLength={8} className="input-field" />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-sn-slate dark:text-gray-300">{t('confirmPassword')}</label>
        <input type="password" name="confirm_password" required minLength={8} className="input-field" />
      </div>

      <button type="submit" className="btn-primary w-full">
        {t('submit')}
      </button>
    </form>
  );
}
