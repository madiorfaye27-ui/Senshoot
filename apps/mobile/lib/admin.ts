import type { Order, Payout, Photographer, Profile, Subscription } from '@shootsenegal/shared';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from './api';

interface AdminOverview {
  photographers: (Photographer & { profiles: { first_name: string; last_name: string; phone: string | null } | null })[];
  payouts: (Payout & { photographers: { studio_name: string | null; slug: string } | null })[];
  subscriptions: (Subscription & {
    photographers: { studio_name: string | null; slug: string } | null;
    plans: { name: string; price_fcfa: number } | null;
  })[];
  orders: (Order & {
    profiles: { first_name: string; last_name: string } | null;
    photographers: { studio_name: string | null } | null;
  })[];
  users: (Profile & { email: string | null })[];
}

// Shared across all admin tabs (react-query dedupes/caches by key), since
// there's a single GET /api/admin/overview backing all of them — see
// app/api/admin/overview/route.ts for why this couldn't just be a direct
// Supabase query like the client/photographer screens use (admin reads
// need the service_role key, which the mobile app can never hold).
export function useAdminOverview() {
  return useQuery({
    queryKey: ['admin-overview'],
    queryFn: () => apiFetch('/api/admin/overview') as Promise<AdminOverview>,
  });
}
