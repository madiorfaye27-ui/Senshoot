import type { Profile, UserRole } from '@shootsenegal/shared';
import type { Session } from '@supabase/supabase-js';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { supabase } from './supabase';

interface AuthState {
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (params: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role: Extract<UserRole, 'client' | 'photographer'>;
  }) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

// Fetches the profiles row for the current session — role isn't in the
// Supabase Auth session itself, it's app data in public.profiles, created
// server-side by the on_auth_user_created trigger (migration 0007) right
// after signUp regardless of which client (web or mobile) called it.
async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
  return (data as Profile) ?? null;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      setSession(session);
      if (session) setProfile(await fetchProfile(session.user.id));
      setLoading(false);
    });

    const { data: subscription } = supabase.auth.onAuthStateChange(async (_event, session) => {
      // Without this, there's a render where session is already set but
      // profile is still the previous (often null) value — long enough for
      // Index/RoleGuard to redirect on stale role info, which round-trips
      // back once the profile resolves and can cycle fast enough to trip
      // React's "Maximum update depth exceeded" guard.
      setLoading(true);
      setSession(session);
      setProfile(session ? await fetchProfile(session.user.id) : null);
      setLoading(false);
    });

    return () => subscription.subscription.unsubscribe();
  }, []);

  const signIn: AuthState['signIn'] = async (email, password) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signUp: AuthState['signUp'] = async ({ email, password, firstName, lastName, role }) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { role, first_name: firstName, last_name: lastName } },
    });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ session, profile, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
