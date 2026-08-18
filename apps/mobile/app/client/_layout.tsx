import { Tabs } from 'expo-router';
import { RoleGuard } from '@/components/RoleGuard';

export default function ClientLayout() {
  return (
    <RoleGuard role="client">
      <Tabs screenOptions={{ tabBarActiveTintColor: '#ff8e00', headerTintColor: '#526272' }}>
        <Tabs.Screen name="index" options={{ title: 'Accueil' }} />
        <Tabs.Screen name="orders" options={{ title: 'Commandes' }} />
        <Tabs.Screen name="downloads" options={{ title: 'Téléchargements' }} />
        <Tabs.Screen name="profile" options={{ title: 'Profil' }} />
      </Tabs>
    </RoleGuard>
  );
}
