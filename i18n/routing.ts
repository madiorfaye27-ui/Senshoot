import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['fr', 'en'],
  defaultLocale: 'fr',
  // Le français (langue par défaut) reste sur les URLs actuelles sans
  // préfixe (/tarifs) ; seul l'anglais est préfixé (/en/tarifs). Ça évite
  // de devoir réécrire tous les liens/redirections déjà en place.
  localePrefix: 'as-needed',
});
