import { createHash } from 'crypto';
import { NextRequest } from 'next/server';

/**
 * Limiteur de débit par IP + par route.
 *
 * Si un Redis Upstash est configuré (UPSTASH_REDIS_REST_URL +
 * UPSTASH_REDIS_REST_TOKEN, ou KV_REST_API_URL + KV_REST_API_TOKEN quand il
 * est ajouté via l'intégration Vercel), les compteurs y sont partagés entre
 * toutes les instances du serveur : la limite est alors réellement "N
 * requêtes par fenêtre", quel que soit le nombre d'instances Vercel.
 *
 * Sans Redis — ou si Redis ne répond pas dans le délai imparti — on retombe
 * sur un compteur EN MÉMOIRE, propre à chaque instance : moins strict en
 * scale-out, mais le site continue de fonctionner (jamais de blocage des
 * vrais utilisateurs à cause d'une panne du limiteur).
 *
 * Fenêtre fixe alignée sur l'horloge : une rafale à cheval sur deux fenêtres
 * peut laisser passer jusqu'à 2×N requêtes. Suffisant pour freiner un script
 * de force brute ou de spam.
 */
export type RateLimitResult = { allowed: boolean; remaining: number };

// ---------- Repli : compteur en mémoire (par instance) ----------

const hits = new Map<string, { count: number; resetAt: number }>();

// Purge périodique pour éviter une fuite mémoire sur le long terme
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of hits) {
    if (entry.resetAt < now) hits.delete(key);
  }
}, 5 * 60_000).unref?.();

function memoryLimit(key: string, maxRequests: number, windowMs: number): RateLimitResult {
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

// ---------- Compteur partagé : Upstash Redis (API REST) ----------

const REDIS_TIMEOUT_MS = 1000;
const WARN_EVERY_MS = 60_000;
let lastWarnAt = 0;

function redisConfig() {
  const url = process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN;
  return url && token ? { url: url.replace(/\/$/, ''), token } : null;
}

function warnRedisFailure(reason: string) {
  const now = Date.now();
  if (now - lastWarnAt < WARN_EVERY_MS) return;
  lastWarnAt = now;
  console.warn(`[rate-limit] Redis indisponible (${reason}) — repli sur le compteur en mémoire`);
}

// La clé contient l'IP du visiteur et parfois un jeton d'accès (ex. lien de
// téléchargement) : on ne les stocke jamais en clair dans Redis.
function redisKey(key: string, windowId: number) {
  const prefix = key.split(':')[0].replace(/[^a-z0-9-]/gi, '').slice(0, 40);
  const digest = createHash('sha256').update(key).digest('hex').slice(0, 32);
  return `rl:${prefix}:${digest}:${windowId}`;
}

// Renvoie null en cas d'échec (l'appelant se rabat alors sur la mémoire).
async function redisLimit(
  config: { url: string; token: string },
  key: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult | null> {
  const redisK = redisKey(key, Math.floor(Date.now() / windowMs));
  try {
    // SET ... NX pose la durée de vie une seule fois (à la création du
    // compteur), puis INCR l'incrémente : une seule requête HTTP pour les deux.
    const res = await fetch(`${config.url}/pipeline`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${config.token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify([
        ['SET', redisK, '0', 'PX', String(windowMs), 'NX'],
        ['INCR', redisK],
      ]),
      cache: 'no-store',
      signal: AbortSignal.timeout(REDIS_TIMEOUT_MS),
    });
    if (!res.ok) {
      warnRedisFailure(`HTTP ${res.status}`);
      return null;
    }
    const out = (await res.json()) as Array<{ result?: unknown; error?: string }>;
    const count = Number(out?.[1]?.result);
    if (!Number.isFinite(count)) {
      warnRedisFailure(out?.[1]?.error ?? 'réponse inattendue');
      return null;
    }
    return count > maxRequests
      ? { allowed: false, remaining: 0 }
      : { allowed: true, remaining: maxRequests - count };
  } catch (err) {
    warnRedisFailure(err instanceof Error ? err.name : 'erreur réseau');
    return null;
  }
}

// ---------- API publique ----------

export async function checkRateLimit(
  request: NextRequest,
  bucket: string,
  maxRequests: number,
  windowMs: number
): Promise<RateLimitResult> {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
    request.headers.get('x-real-ip') ||
    'unknown';

  const key = `${bucket}:${ip}`;

  const redis = redisConfig();
  if (redis) {
    const result = await redisLimit(redis, key, maxRequests, windowMs);
    if (result) return result;
  }

  return memoryLimit(key, maxRequests, windowMs);
}
