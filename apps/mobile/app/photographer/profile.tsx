import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiFetch } from '@/lib/api';
import { useAuth } from '@/lib/auth';
import { supabase } from '@/lib/supabase';

export default function PhotographerProfile() {
  const { profile, session, signOut } = useAuth();
  const router = useRouter();
  const [studioName, setStudioName] = useState('');
  const [city, setCity] = useState('');
  const [contactPhone, setContactPhone] = useState('');
  const [contactWhatsapp, setContactWhatsapp] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('photographers')
      .select('studio_name, city, contact_phone, contact_whatsapp')
      .eq('profile_id', profile.id)
      .single()
      .then(({ data }) => {
        if (!data) return;
        setStudioName(data.studio_name ?? '');
        setCity(data.city ?? '');
        setContactPhone(data.contact_phone ?? '');
        setContactWhatsapp(data.contact_whatsapp ?? '');
      });
  }, [profile]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    setError(null);
    try {
      await apiFetch('/api/photographers/profile', {
        method: 'POST',
        body: JSON.stringify({
          studio_name: studioName,
          city,
          contact_phone: contactPhone,
          contact_whatsapp: contactWhatsapp,
        }),
      });
      setSaved(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-sn-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="px-6 py-8">
        <Text className="text-2xl font-bold text-sn-slate">
          {profile?.first_name} {profile?.last_name}
        </Text>
        <Text className="mb-6 mt-1 text-sn-slate">{session?.user.email}</Text>

        <FormInput label="Nom du studio" value={studioName} onChangeText={setStudioName} />
        <FormInput label="Ville" value={city} onChangeText={setCity} />
        <FormInput label="Téléphone" value={contactPhone} onChangeText={setContactPhone} keyboardType="phone-pad" />
        <FormInput label="WhatsApp" value={contactWhatsapp} onChangeText={setContactWhatsapp} keyboardType="phone-pad" />

        {saved ? <Text className="mb-4 text-sn-teal">Profil mis à jour.</Text> : null}
        {error ? <Text className="mb-4 text-sn-orange">{error}</Text> : null}
        <View className="gap-3">
          <PrimaryButton title="Enregistrer" onPress={save} loading={saving} />
          <PrimaryButton
            title="Mon abonnement"
            onPress={() => router.push('/photographer/subscription')}
            variant="outline"
          />
          <PrimaryButton title="Se déconnecter" onPress={signOut} variant="outline" />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
