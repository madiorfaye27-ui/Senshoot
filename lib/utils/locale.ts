import { routing } from '@/i18n/routing';

const LOCALE_PREFIX_RE = new RegExp(`^/(${routing.locales.join('|')})(?=/|$)`);

// Extrait le préfixe de langue courant (ex: "/en", ou "" pour le français,
// langue par défaut sans préfixe — voir i18n/routing.ts) à partir d'un
// pathname, pour construire des redirections serveur qui restent dans la
// bonne langue (ex: après connexion/inscription).
export function getLocalePrefix(pathname: string): string {
  const match = pathname.match(LOCALE_PREFIX_RE);
  return match ? match[0] : '';
}
