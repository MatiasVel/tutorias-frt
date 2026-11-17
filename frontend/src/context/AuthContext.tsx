import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import { api, json, refreshSession, setAccessToken, setSessionExpiredHandler } from '../api/client';
import type { Me } from '../api/types';

interface AuthState {
  user: Me | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  reloadUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<Me | null>(null);
  const [loading, setLoading] = useState(true);

  const reloadUser = useCallback(async () => {
    setUser(await api<Me>('/auth/me'));
  }, []);

  // Al abrir la app se intenta recuperar la sesión con la cookie httpOnly
  useEffect(() => {
    setSessionExpiredHandler(() => setUser(null));
    refreshSession()
      .then(async (s) => {
        if (s) await reloadUser();
      })
      .catch(() => undefined)
      .finally(() => setLoading(false));
  }, [reloadUser]);

  const login = async (email: string, password: string) => {
    const res = await api<{ accessToken: string }>('/auth/login', {
      method: 'POST',
      body: json({ email, password }),
    });
    setAccessToken(res.accessToken);
    await reloadUser();
  };

  const logout = async () => {
    await api('/auth/logout', { method: 'POST' }).catch(() => undefined);
    setAccessToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, reloadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
