import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { QueryState } from '@/components/QueryState';
import { useAdminOverview } from '@/lib/admin';

export default function AdminHome() {
  const router = useRouter();
  const { data, isLoading, refetch } = useAdminOverview();

  if (isLoading || !data) {
    return <QueryState isLoading={isLoading} onRetry={refetch} />;
  }

  const pendingPhotographers = data.photographers.filter((p) => p.status === 'pending').length;
  const pendingPayouts = data.payouts.filter((p) => p.status === 'pending').length;

  const links = [
    { title: 'Commandes', count: data.orders.length, href: '/admin/orders' as const },
    { title: 'Abonnements', count: data.subscriptions.length, href: '/admin/subscriptions' as const },
    { title: 'Utilisateurs', count: data.users.length, href: '/admin/users' as const },
  ];

  return (
    <View className="flex-1 bg-sn-white px-4 pt-6">
      <Text className="text-2xl font-bold text-sn-slate">Administration</Text>

      <View className="mt-6 flex-row gap-3">
        <View className="flex-1 rounded-xl bg-white p-4 shadow-sm">
          <Text className="text-xs font-medium uppercase text-gray-400">Photographes en attente</Text>
          <Text className="mt-2 text-xl font-bold text-sn-orange">{pendingPhotographers}</Text>
        </View>
        <View className="flex-1 rounded-xl bg-white p-4 shadow-sm">
          <Text className="text-xs font-medium uppercase text-gray-400">Retraits en attente</Text>
          <Text className="mt-2 text-xl font-bold text-sn-orange">{pendingPayouts}</Text>
        </View>
      </View>

      <View className="mt-6 gap-3">
        {links.map((link) => (
          <Pressable
            key={link.href}
            onPress={() => router.push(link.href)}
            className="flex-row items-center justify-between rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
          >
            <Text className="font-semibold text-sn-slate">{link.title}</Text>
            <Text className="text-sm text-sn-teal">{link.count}</Text>
          </Pressable>
        ))}
      </View>
    </View>
  );
}
