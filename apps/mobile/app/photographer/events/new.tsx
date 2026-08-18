import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text } from 'react-native';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { apiFetch } from '@/lib/api';

export default function NewEvent() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [city, setCity] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const data = await apiFetch('/api/events', {
        method: 'POST',
        body: JSON.stringify({ name, city, event_date: eventDate || undefined, category: 'autre' }),
      });
      router.replace({ pathname: '/photographer/events/[eventId]', params: { eventId: data.event.id } });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-sn-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="px-6 py-8">
        <Text className="mb-6 text-2xl font-bold text-sn-slate">Nouvel événement</Text>

        <FormInput label="Nom de l'événement" value={name} onChangeText={setName} autoCapitalize="words" />
        <FormInput label="Ville" value={city} onChangeText={setCity} autoCapitalize="words" />
        <FormInput label="Date (AAAA-MM-JJ)" value={eventDate} onChangeText={setEventDate} placeholder="2026-12-25" />

        {error ? <Text className="mb-4 text-sn-orange">{error}</Text> : null}

        <PrimaryButton title="Créer l'événement" onPress={submit} loading={submitting} disabled={!name.trim()} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
