import { Link, Redirect } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, Text, View } from 'react-native';
import { FormInput } from '@/components/FormInput';
import { PrimaryButton } from '@/components/PrimaryButton';
import { useAuth } from '@/lib/auth';

export default function Login() {
  const { session, signIn, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (!authLoading && session) return <Redirect href="/" />;

  const handleSubmit = async () => {
    setError(null);
    setSubmitting(true);
    const { error } = await signIn(email.trim(), password);
    setSubmitting(false);
    if (error) setError(error);
  };

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-sn-white"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerClassName="flex-1 justify-center px-6">
        <Text className="mb-1 text-3xl font-bold text-sn-slate">Connexion</Text>
        <Text className="mb-8 text-sn-slate">Accédez à votre compte Senshoot Sénégal.</Text>

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
          autoComplete="password"
        />

        {error ? <Text className="mb-4 text-sn-orange">{error}</Text> : null}

        <PrimaryButton title="Se connecter" onPress={handleSubmit} loading={submitting} />

        <View className="mt-6 flex-row justify-center">
          <Text className="text-sn-slate">Pas encore de compte ? </Text>
          <Link href="/register" className="font-semibold text-sn-teal">
            S'inscrire
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
