import { Tabs } from 'expo-router';
import { RoleGuard } from '@/components/RoleGuard';

export default function AdminLayout() {
  return (
    <RoleGuard role="admin">
      <Tabs screenOptions={{ tabBarActiveTintColor: '#ff8e00', headerTintColor: '#526272' }}>
        <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
        <Tabs.Screen name="photographers" options={{ title: 'Photographes' }} />
        <Tabs.Screen name="payouts" options={{ title: 'Retraits' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
        <Tabs.Screen name="orders" options={{ href: null }} />
        <Tabs.Screen name="subscriptions" options={{ href: null }} />
        <Tabs.Screen name="users" options={{ href: null }} />
      </Tabs>
    </RoleGuard>
  );
}
