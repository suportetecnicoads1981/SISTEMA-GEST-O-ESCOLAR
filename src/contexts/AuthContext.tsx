import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { getSupabaseClient } from '../services/datasync/supabaseClient';
import { UserRole, UserProfile, ROLES } from '../types';
import { normalizeRole } from '../utils/roleNormalizer';
import { subscribeToFirebaseAuth } from '../services/firebaseAuthService';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  role: UserRole;
  isAdmin: boolean;
  isTeacher: boolean;
  isStudent: boolean;
  isParent: boolean;
  loading: boolean;
  isInitializing: boolean;
  error: string | null;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isInitializing, setIsInitializing] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Derivação de Role com fallback estrito para 'STUDENT' via normalizeRole
  const role: UserRole = useMemo(() => {
    // 1. app_metadata.role do JWT
    const appRole = user?.app_metadata?.role;
    if (appRole) {
      return normalizeRole(appRole);
    }

    // 2. Profile role se existir
    if (profile?.role) {
      return normalizeRole(profile.role);
    }

    // Fallback seguro especificado nas diretrizes
    return 'STUDENT';
  }, [user, profile]);

  const isAdmin = useMemo(() => {
    return role === 'ADMIN' || user?.app_metadata?.role === 'ADMIN' || profile?.role === 'ADMIN';
  }, [user, profile, role]);

  const isTeacher = useMemo(() => {
    return role === 'TEACHER' || user?.app_metadata?.role === 'TEACHER' || profile?.role === 'TEACHER';
  }, [user, profile, role]);

  const isStudent = useMemo(() => {
    return role === 'STUDENT' || user?.app_metadata?.role === 'STUDENT' || profile?.role === 'STUDENT';
  }, [user, profile, role]);

  const isParent = useMemo(() => {
    return role === 'PARENT' || user?.app_metadata?.role === 'PARENT' || profile?.role === 'PARENT';
  }, [user, profile, role]);

  const fetchProfile = async (currentUser: User) => {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', currentUser.id)
        .single();

      if (!error && data) {
        setProfile({
          id: data.id,
          email: data.email || currentUser.email || '',
          name: data.name || currentUser.user_metadata?.name || 'Usuário',
          role: normalizeRole(data.role || currentUser.app_metadata?.role),
          avatar_url: data.avatar_url,
          created_at: data.created_at,
          updated_at: data.updated_at,
        });
      } else {
        // Fallback local caso a tabela ainda não tenha sido populada
        setProfile({
          id: currentUser.id,
          email: currentUser.email || '',
          name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
          role: normalizeRole(currentUser.app_metadata?.role),
        });
      }
    } catch {
      setProfile({
        id: currentUser.id,
        email: currentUser.email || '',
        name: currentUser.user_metadata?.name || currentUser.email?.split('@')[0] || 'Usuário',
        role: normalizeRole(currentUser.app_metadata?.role),
      });
    }
  };

  const refreshUser = async () => {
    try {
      const supabase = getSupabaseClient();
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      setSession(currentSession);
      setUser(currentSession?.user ?? null);

      if (currentSession?.user) {
        await fetchProfile(currentSession.user);
      } else {
        setProfile(null);
      }
    } catch (err: any) {
      setError(err?.message || 'Erro ao carregar sessão.');
    } finally {
      setLoading(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    const supabase = getSupabaseClient();

    // Obter sessão inicial
    supabase.auth.getSession().then(({ data: { session: initialSession }, error: initialError }) => {
      if (!isMounted) return;
      if (initialError) {
        setError(initialError.message);
      }
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchProfile(initialSession.user).finally(() => {
          if (isMounted) {
            setLoading(false);
            setIsInitializing(false);
          }
        });
      } else {
        if (isMounted) {
          setLoading(false);
          setIsInitializing(false);
        }
      }
    });

    // Escutar mudanças de autenticação no Supabase
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
        setIsInitializing(false);
      } else if (newSession?.user) {
        await fetchProfile(newSession.user);
        setLoading(false);
        setIsInitializing(false);
      } else {
        setLoading(false);
        setIsInitializing(false);
      }
    });

    // Assinatura Firebase Auth complementar para garantir sincronização
    const unsubscribeFirebase = subscribeToFirebaseAuth((fbUser, fbProfile) => {
      if (!isMounted) return;
      if (fbProfile && (!profile || profile.role !== fbProfile.role)) {
        setProfile(fbProfile);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      unsubscribeFirebase();
    };
  }, []);

  const signOut = async () => {
    try {
      const supabase = getSupabaseClient();
      await supabase.auth.signOut();
    } catch (err) {
      console.error('[AuthContext] Erro ao deslogar:', err);
    } finally {
      setUser(null);
      setSession(null);
      setProfile(null);
      setLoading(false);
      setIsInitializing(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        role,
        isAdmin,
        isTeacher,
        isStudent,
        isParent,
        loading,
        isInitializing,
        error,
        refreshUser,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    // Fallback seguro caso o componente seja renderizado fora do AuthProvider
    return {
      user: null,
      session: null,
      profile: null,
      role: 'STUDENT',
      isAdmin: false,
      isTeacher: false,
      isStudent: true,
      isParent: false,
      loading: false,
      isInitializing: false,
      error: null,
      refreshUser: async () => {},
      signOut: async () => {},
    };
  }
  return context;
};
