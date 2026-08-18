import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/lib/auth';

type Role = 'client' | 'photographer';

export default function Register() {
  const { session, signUp, loading: authLoading } = useAuth();
  const [role, setRole] = useState<Role>('client');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && session) return <Redirect href="/" />;

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const { error } = await signUp({
      email: email.trim(),
      password,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      role,
    });
    setSubmitting(false);
    if (error) setError(error);
    else setSubmitted(true);
  };

  // Same flow as the web app: Supabase requires email confirmation before
  // a session exists, so there's nothing to redirect into yet.
  if (submitted) {
    return (
      <View className="flex-1 items-center justify-center bg-sn-white px-6">
        <Text className="mb-2 text-center text-2xl font-bold text-sn-slate">
          Vérifiez votre boîte mail
        </Text>
        <Text className="text-center text-sn-slate">
          Un email de confirmation a été envoyé à {email}. Confirmez votre adresse puis
          connectez-vous.
        </Text>
        <View className="mt-6">
          <Link href="/login" className="font-semibold text-sn-teal">
            Aller à la connexion
          </Link>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-sn-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="justify-center px-6 py-12">
        <Text className="mb-1 text-3xl font-bold text-sn-slate">Créer un compte</Text>
        <Text className="mb-6 text-sn-slate">Rejoignez Senshoot Sénégal.</Text>

        <View className="mb-6 flex-row gap-3">
          <Pressable
            onPress={() => setRole('client')}
            className={`flex-1 items-center rounded-lg border px-4 py-3 ${
              role === 'client' ? 'border-sn-orange bg-sn-orange/10' : 'border-gray-300'
            }`}
          >
            <Text className={role === 'client' ? 'font-semibold text-sn-orange' : 'text-sn-slate'}>
              Client
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setRole('photographer')}
            className={`flex-1 items-center rounded-lg border px-4 py-3 ${
              role === 'photographer' ? 'border-sn-orange bg-sn-orange/10' : 'border-gray-300'
            }`}
          >
            <Text
              className={role === 'photographer' ? 'font-semibold text-sn-orange' : 'text-sn-slate'}
            >
              Photographe
            </Text>
          </Pressable>
        </View>

        <FormInput label="Prénom" value={firstName} onChangeText={setFirstName} autoComplete="given-name" />
        <FormInput label="Nom" value={lastName} onChangeText={setLastName} autoComplete="family-name" />
        <FormInput
          label="Email"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoComplete="email"
        />
        <FormInput
          label="Mot de passe"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete="password-new"
        />

        {error ? <Text className="mb-4 text-sn-orange">{error}</Text> : null}

        <PrimaryButton title="S'inscrire" onPress={handleSubmit} loading={submitting} />

        <View className="mt-6 flex-row justify-center">
          <Text className="text-sn-slate">Déjà un compte ? </Text>
          <Link href="/login" className="font-semibold text-sn-teal">
            Se connecter
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
