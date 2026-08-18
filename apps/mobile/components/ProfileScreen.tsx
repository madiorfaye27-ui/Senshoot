import { Text, View } from 'react-native';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/lib/auth';

export function ProfileScreen({ roleLabel }: { roleLabel: string }) {
  const { profile, session, signOut } = useAuth();

  return (
    <View className="flex-1 bg-sn-white px-6 pt-8">
      <Text className="text-2xl font-bold text-sn-slate">
        {profile?.first_name} {profile?.last_name}
      </Text>
      <Text className="mt-1 text-sn-slate">{session?.user.email}</Text>
      <Text className="mt-1 text-sn-teal">{roleLabel}</Text>

      <View className="mt-8">
        <PrimaryButton title="Se déconnecter" onPress={signOut} variant="outline" />
      </View>
    </View>
  );
}
