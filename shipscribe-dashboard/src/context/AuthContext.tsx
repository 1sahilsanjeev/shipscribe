import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  logout: () => Promise<void>;
  isAdmin: boolean;
  accessStatus: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [accessStatus, setAccessStatus] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async (session: Session | null) => {
      setSession(session);
      if (session) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, email, api_key, plan, has_completed_onboarding, access_status')
          .eq('id', session.user.id)
          .single();

        // Also check if admin (case-insensitive)
        const { data: adminEntry, error: adminError } = await supabase
          .from('admin_users')
          .select('id')
          .ilike('email', session.user.email || '')
          .maybeSingle();

        if (adminError) console.error('[auth] Admin check error:', adminError);
        console.log('[auth] Admin check for:', session.user.email, 'Found:', !!adminEntry);

        // Only sign out if they have a profile but no API key AND are NOT an admin
        // This prevents new signups or admins from being kicked out immediately
        if (profile && !profile.api_key && !adminEntry && profile.access_status === 'approved') {
          console.warn('[auth] Account missing API key — signing out');
          await supabase.auth.signOut();
          setUser(null);
          setIsAdmin(false);
          setAccessStatus(null);
        } else {
          setUser({ ...session.user, ...profile } as any);
          setIsAdmin(!!adminEntry);
          setAccessStatus(profile?.access_status || 'waiting');
        }
      } else {
        setUser(null);
        setIsAdmin(false);
        setAccessStatus(null);
      }
      setLoading(false);
    };

    // 1. Check active sessions on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      checkUser(session);
    });

    // 2. Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      checkUser(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, logout, isAdmin, accessStatus }}>
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
