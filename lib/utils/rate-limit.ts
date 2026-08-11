import { NextRequest } from 'next/server';

/**
 * Limiteur de débit basique, en mémoire, par IP + par route.
 *
 * ⚠️ Limitation connue : cette mémoire est PAR INSTANCE du serveur.
 * Sur une plateforme avec plusieurs instances (ex. Vercel en scale-out),
 * chaque instance a son propre compteur, donc la limite réelle est
 * "N requêtes × nombre d'instances". Suffisant pour dissuader un script
 * naïf en V1, mais pour une protection robuste en production, remplacer
 * par un store partagé (ex. Upstash Redis + @upstash/ratelimit).
 */
const hits = new Map<string, { count: number; resetAt: number }>();

// Purge périodique pour éviter une fuite mémoire sur le long terme
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (entry.resetAt < now) hits.delete(key);
  }
}, 5 * 60_000).unref?.();

export function checkRateLimit(
  request: NextRequest,
  bucket: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; remaining: number } {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const key = `${bucket}:${ip}`;
  const now = Date.now();
  const entry = hits.get(key);

  if (!entry || entry.resetAt < now) {
    hits.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: maxRequests - 1 };
  }

  if (entry.count >= maxRequests) {
    return { allowed: false, remaining: 0 };
  }

  entry.count += 1;
  return { allowed: true, remaining: maxRequests - entry.count };
}
