import type { UserRole } from '@shootsenegal/shared';
import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuth } from '@/lib/auth';

// Client-side equivalent of the role-based route protection apps/web's
// middleware.ts applies to /admin, /client, /dashboard — there's no
// middleware layer in a native app, so each role's root layout guards itself.
export function RoleGuard({ role, children }: { role: UserRole; children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white">
        <ActivityIndicator color="#ff8e00" />
      </View>
    );
  }

  if (!session) return <Redirect href="/login" />;
  if (profile?.role !== role) return <Redirect href="/" />;

  return <>{children}</>;
}
