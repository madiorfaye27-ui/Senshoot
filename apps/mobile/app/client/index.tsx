import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/lib/auth';

export default function ClientHome() {
  const { profile } = useAuth();
  const router = useRouter();
  const [code, setCode] = useState('');

  const openGallery = () => {
    const trimmed = code.trim().toUpperCase();
    if (trimmed) router.push(`/gallery/${trimmed}`);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-sn-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View className="flex-1 justify-center px-6">
        <Text className="mb-1 text-2xl font-bold text-sn-slate">
          Bonjour {profile?.first_name ?? ''}
        </Text>
        <Text className="mb-8 text-sn-slate">
          Scannez le QR Code d'un événement pour découvrir sa galerie.
        </Text>

        <PrimaryButton title="Scanner un QR Code" onPress={() => router.push('/scan')} />

        <View className="my-6 flex-row items-center">
          <View className="h-px flex-1 bg-gray-200" />
          <Text className="mx-3 text-xs text-gray-400">OU</Text>
          <View className="h-px flex-1 bg-gray-200" />
        </View>

        <FormInput
          label="Code de l'événement"
          value={code}
          onChangeText={setCode}
          autoCapitalize="characters"
          placeholder="Ex : SS4X7K2Q"
        />
        <PrimaryButton title="Voir la galerie" onPress={openGallery} variant="outline" />
      </View>
    </KeyboardAvoidingView>
  );
}
