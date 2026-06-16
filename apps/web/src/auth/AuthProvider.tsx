import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { isSupabaseConfigured, supabase } from '../lib/supabase';
import { Modal } from '../components/Modal';
import { LoginForm } from './LoginForm';

interface AuthContextValue {
  /** Whether Supabase Auth is configured. When false, the app is in mock mode. */
  isConfigured: boolean;
  user: User | null;
  session: Session | null;
  loading: boolean;
  /** Send a magic link to the given email. */
  signInWithEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  /** Open the sign-in modal (used to gate write actions). */
  promptSignIn: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(isSupabaseConfigured);
  const [showLogin, setShowLogin] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (next) setShowLogin(false);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      isConfigured: isSupabaseConfigured,
      user: session?.user ?? null,
      session,
      loading,
      signInWithEmail: async (email: string) => {
        if (!supabase) throw new Error('Auth is not configured.');
        const { error } = await supabase.auth.signInWithOtp({
          email,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
      },
      signOut: async () => {
        await supabase?.auth.signOut();
        setSession(null);
      },
      promptSignIn: () => setShowLogin(true),
    }),
    [session, loading],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
      {showLogin && (
        <Modal title="Sign in to BetterReviews" onClose={() => setShowLogin(false)}>
          <LoginForm />
        </Modal>
      )}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
