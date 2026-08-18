import { Tabs } from 'expo-router';
import { RoleGuard } from '@/components/RoleGuard';

export default function PhotographerLayout() {
  return (
    <RoleGuard role="photographer">
      <Tabs screenOptions={{ tabBarActiveTintColor: '#ff8e00', headerTintColor: '#526272' }}>
        <Tabs.Screen name="index" options={{ title: 'Tableau de bord' }} />
        <Tabs.Screen name="events" options={{ title: 'Événements' }} />
        <Tabs.Screen name="sales" options={{ title: 'Ventes' }} />
        <Tabs.Screen name="bookings" options={{ title: 'Réservations' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
        <Tabs.Screen name="subscription" options={{ href: null }} />
      </Tabs>
    </RoleGuard>
  );
}
