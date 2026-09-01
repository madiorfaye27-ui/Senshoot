import { createAdminClient } from '@/lib/supabase/server';

type AdminClient = ReturnType<typeof createAdminClient>;

const BYTES_PER_GB = 1024 * 1024 * 1024;

// Quota appliqué à un photographe sans forfait actif — même logique
// d'incitation que NO_PLAN_COMMISSION_RATE (lib/utils/payouts.ts) : le
// plus bas de la grille, pour encourager à s'abonner.
export const NO_PLAN_MAX_STORAGE_GB = 1;

// Limite de stockage applicable au photographe, en octets. `null` = pas
// de limite (forfait Premium, max_storage_gb vaut null en base).
export async function getStorageLimitBytes(
  admin: AdminClient,
  photographerId: string
): Promise<number | null> {
  const { data: subscription } = await admin
    .from('subscriptions')
    .select('plans(max_storage_gb)')
    .eq('photographer_id', photographerId)
    .eq('status', 'active')
    .single();

  const plan = subscription?.plans as { max_storage_gb: number | null } | { max_storage_gb: number | null }[] | null | undefined;
  const entry = Array.isArray(plan) ? plan[0] : plan;

  if (!entry) return NO_PLAN_MAX_STORAGE_GB * BYTES_PER_GB;
  if (entry.max_storage_gb === null) return null;
  return entry.max_storage_gb * BYTES_PER_GB;
}

export async function getStorageUsedBytes(admin: AdminClient, photographerId: string): Promise<number> {
  const { data } = await admin.rpc('get_photographer_storage_bytes', { p_photographer_id: photographerId });
  return typeof data === 'number' ? data : Number(data ?? 0);
}
