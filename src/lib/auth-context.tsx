'use client';

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { createClient, isSupabaseConfigured } from '@/lib/supabase/client';
import { Profile, UserRole } from '@/types/database';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  isConfigured: boolean;
  signInWithPassword: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (
    email: string,
    password: string,
    fullName: string,
    role?: UserRole
  ) => Promise<{ error: string | null; requiresEmailConfirmation?: boolean }>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<{ error: string | null }>;
  updatePassword: (newPassword: string) => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
  signInAsDemo: (role?: UserRole) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_ADMIN_PROFILE: Profile = {
  id: 'usr-admin-demo-001',
  email: 'admin@alibekcrm.kz',
  full_name: 'Алибек М.',
  role: 'admin',
  phone: '+7 (777) 001-02-03',
  avatar_url: null,
  is_active: true,
  created_at: '2026-10-30T00:00:00Z',
};

const DEMO_MANAGER_PROFILE: Profile = {
  id: 'usr-mgr-demo-002',
  email: 'manager@alibekcrm.kz',
  full_name: 'Данияр К.',
  role: 'manager',
  phone: '+7 (777) 456-78-90',
  avatar_url: null,
  is_active: true,
  created_at: '2026-10-30T00:00:00Z',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isConfigured] = useState<boolean>(() => isSupabaseConfigured());

  const supabase = createClient();

  // Загрузка профиля пользователя из таблицы profiles
  const loadProfile = useCallback(async (userId: string, currentUser?: User | null) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (data && !error) {
        setProfile(data as Profile);
        return;
      }

      // Если профиль не найден (триггер еще не сработал или нет доступа по RLS),
      // формируем объект профиля на основе метаданных auth.users
      if (currentUser) {
        const meta = currentUser.user_metadata || {};
        const fallbackProfile: Profile = {
          id: currentUser.id,
          email: currentUser.email || '',
          full_name: meta.full_name || meta.name || currentUser.email?.split('@')[0] || 'Сотрудник',
          role: (meta.role as UserRole) || 'manager',
          phone: meta.phone || null,
          avatar_url: meta.avatar_url || null,
          is_active: true,
          created_at: currentUser.created_at || new Date().toISOString(),
        };
        setProfile(fallbackProfile);
      }
    } catch (err) {
      console.warn('Не удалось загрузить профиль из profiles:', err);
    }
  }, [supabase]);

  // Принудительное обновление текущего профиля
  const refreshProfile = useCallback(async () => {
    if (user) {
      await loadProfile(user.id, user);
    }
  }, [user, loadProfile]);

  // Инициализация при монтировании
  useEffect(() => {
    let mounted = true;

    async function initAuth() {
      if (!isConfigured) {
        // Демо-режим (Supabase ключи не заданы в .env.local)
        // Проверяем сохраненного демо-пользователя в localStorage
        const savedDemo = typeof window !== 'undefined' ? localStorage.getItem('alibek_crm_demo_profile') : null;
        if (savedDemo) {
          try {
            setProfile(JSON.parse(savedDemo));
          } catch {
            setProfile(DEMO_ADMIN_PROFILE);
          }
        } else {
          setProfile(DEMO_ADMIN_PROFILE);
        }
        setLoading(false);
        return;
      }

      try {
        const { data: { session: initialSession } } = await supabase.auth.getSession();
        if (mounted) {
          setSession(initialSession);
          setUser(initialSession?.user ?? null);
          if (initialSession?.user) {
            await loadProfile(initialSession.user.id, initialSession.user);
          }
        }
      } catch (err) {
        console.error('Ошибка инициализации Supabase Auth:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    initAuth();

    // Слушатель изменений состояния авторизации (login, logout, refresh)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        if (!mounted) return;

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (newSession?.user) {
          await loadProfile(newSession.user.id, newSession.user);
        } else {
          setProfile(null);
        }

        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isConfigured, loadProfile, supabase]);

  // Вход по Email и Паролю
  const signInWithPassword = async (email: string, password: string): Promise<{ error: string | null }> => {
    if (!isConfigured) {
      // В демо-режиме симулируем успешный вход
      const demoUser = email.toLowerCase().includes('mgr') ? DEMO_MANAGER_PROFILE : DEMO_ADMIN_PROFILE;
      setProfile(demoUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('alibek_crm_demo_profile', JSON.stringify(demoUser));
      }
      return { error: null };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error: error.message };
      }

      if (data.user) {
        setUser(data.user);
        setSession(data.session);
        await loadProfile(data.user.id, data.user);
      }

      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Неизвестная ошибка входа';
      return { error: msg };
    }
  };

  // Регистрация нового сотрудника
  const signUp = async (
    email: string,
    password: string,
    fullName: string,
    role: UserRole = 'manager'
  ): Promise<{ error: string | null; requiresEmailConfirmation?: boolean }> => {
    if (!isConfigured) {
      const customDemo: Profile = {
        id: 'usr-custom-' + Date.now(),
        email,
        full_name: fullName,
        role,
        is_active: true,
        created_at: new Date().toISOString(),
      };
      setProfile(customDemo);
      if (typeof window !== 'undefined') {
        localStorage.setItem('alibek_crm_demo_profile', JSON.stringify(customDemo));
      }
      return { error: null, requiresEmailConfirmation: false };
    }

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
          emailRedirectTo: `${origin}/auth/callback`,
        },
      });

      if (error) {
        return { error: error.message };
      }

      // Если в Supabase включено подтверждение email (сессия null)
      if (data.user && !data.session) {
        return { error: null, requiresEmailConfirmation: true };
      }

      if (data.user && data.session) {
        setUser(data.user);
        setSession(data.session);
        await loadProfile(data.user.id, data.user);
      }

      return { error: null, requiresEmailConfirmation: false };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка регистрации';
      return { error: msg };
    }
  };

  // Выход из системы
  const signOut = async () => {
    if (isConfigured) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.error('Ошибка выхода Supabase Auth:', err);
      }
    }

    setUser(null);
    setSession(null);
    setProfile(null);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('alibek_crm_demo_profile');
    }
  };

  // Восстановление пароля по email
  const resetPassword = async (email: string): Promise<{ error: string | null }> => {
    if (!isConfigured) {
      return { error: null };
    }

    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${origin}/auth/callback?next=/login?mode=update-password`,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка отправки ссылки сброса пароля';
      return { error: msg };
    }
  };

  // Установка нового пароля (после перехода по ссылке из письма)
  const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
    if (!isConfigured) {
      return { error: null };
    }

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) {
        return { error: error.message };
      }

      return { error: null };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Ошибка обновления пароля';
      return { error: msg };
    }
  };

  // Быстрый демо-вход для разработки
  const signInAsDemo = (role: UserRole = 'admin') => {
    const p = role === 'admin' ? DEMO_ADMIN_PROFILE : DEMO_MANAGER_PROFILE;
    setProfile(p);
    if (typeof window !== 'undefined') {
      localStorage.setItem('alibek_crm_demo_profile', JSON.stringify(p));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        profile,
        loading,
        isConfigured,
        signInWithPassword,
        signUp,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile,
        signInAsDemo,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

