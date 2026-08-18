import { Link, Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, Text, View } from 'react-native';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/lib/auth';

// Mirrors the role-based gating apps/web's middleware.ts does for
// /admin, /client, /dashboard — done here client-side since there's no
// middleware layer in a native app. Unlike the web app's middleware
// though, an ANONYMOUS visitor is not redirected to /login: gallery
// browsing and buying photos as a guest (no account) is core to the web
// app's guest-checkout flow (migration 0016) and has to work here too.
export default function Index() {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white">
        <ActivityIndicator color="#ff8e00" />
      </View>
    );
  }

  if (session) {
    switch (profile?.role) {
      case 'photographer':
        return <Redirect href="/photographer" />;
      case 'admin':
        return <Redirect href="/admin" />;
      default:
        return <Redirect href="/client" />;
    }
  }

  return <PublicHome />;
}

function PublicHome() {
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
        <Text className="mb-1 text-3xl font-bold text-sn-slate">Senshoot Sénégal</Text>
        <Text className="mb-8 text-sn-slate">
          Scannez le QR Code de l'événement ou saisissez son code pour accéder à la galerie.
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

        <View className="mt-10 flex-row justify-center">
          <Text className="text-sn-slate">Photographe ou déjà un compte ? </Text>
          <Link href="/login" className="font-semibold text-sn-teal">
            Se connecter
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}
