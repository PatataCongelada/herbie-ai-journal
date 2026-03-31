import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  encryptionKey: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  setKey: (password: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [encryptionKey, setEncryptionKey] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check active session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      // Restore key from sessionStorage if it exists
      const savedKey = sessionStorage.getItem('herbie_clinical_key');
      if (savedKey) {
        setEncryptionKey(savedKey);
      }
      
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (!session) {
        setEncryptionKey(null); 
        sessionStorage.removeItem('herbie_clinical_key');
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const setKey = (password: string) => {
    setEncryptionKey(password);
    sessionStorage.setItem('herbie_clinical_key', password);
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    setKey(password);
  };

  const signUp = async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    setKey(password);
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    setEncryptionKey(null);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      encryptionKey, 
      isAuthenticated: !!user, 
      isLoading,
      signIn,
      signUp,
      signOut,
      setKey
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
