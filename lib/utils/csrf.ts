import { NextRequest } from 'next/server';

/**
 * Vérifie que la requête POST/PUT/DELETE provient bien du même site
 * (en-tête Origin ou Referer correspond au domaine de l'application),
 * et non d'un formulaire malveillant hébergé ailleurs qui utiliserait
 * le cookie de session de la victime pour agir en son nom (CSRF).
 *
 * Next.js n'offre pas de protection CSRF automatique pour les Route
 * Handlers appelés depuis un <form action="..."> classique (contrairement
 * aux Server Actions) — cette vérification comble ce trou.
 */
export function isSameOriginRequest(request: NextRequest): boolean {
  const origin = request.headers.get('origin') || request.headers.get('referer');
  if (!origin) return false;

  try {
    const originHost = new URL(origin).host;
    const requestHost = request.nextUrl.host;
    return originHost === requestHost;
  } catch {
    return false;
  }
}
