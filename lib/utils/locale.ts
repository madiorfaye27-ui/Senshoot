import { routing } from '@/i18n/routing';

// À utiliser dans les routes API (ex: /api/auth/login) : contrairement
// aux pages, `request.nextUrl.pathname` y vaut toujours le chemin de la
// route elle-même (ex: "/api/auth/login"), jamais celui de la page qui a
// soumis le formulaire — impossible d'en extraire la langue. La langue
// doit donc être transmise explicitement (champ caché du formulaire,
// paramètre de requête) puis convertie ici en préfixe de redirection.
export function localeToPrefix(locale: string | null | undefined): string {
  const value = locale ?? '';
  return routing.locales.includes(value as (typeof routing.locales)[number]) && value !== routing.defaultLocale
    ? `/${value}`
    : '';
}
