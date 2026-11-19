import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { api, TOKEN_KEY, unwrap } from '@/lib/api';
import type { ApiEnvelope, AuthResponse, User } from '@/types/api';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (email: string, password: string) => Promise<User>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(() => Boolean(localStorage.getItem(TOKEN_KEY)));

  useEffect(() => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      setIsLoading(false);
      return;
    }
    let active = true;
    api.get<ApiEnvelope<User>>('/auth/me')
      .then((response) => {
        if (active) setUser(unwrap(response));
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_KEY);
        if (active) setUser(null);
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('youdemy:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('youdemy:unauthorized', handleUnauthorized);
  }, []);

  const establishSession = useCallback((response: AuthResponse) => {
    localStorage.setItem(TOKEN_KEY, response.token);
    setUser(response.user);
    return response.user;
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const response = await api.post<ApiEnvelope<AuthResponse>>('/auth/login', { email, password });
    return establishSession(unwrap(response));
  }, [establishSession]);

  const register = useCallback(async (email: string, password: string) => {
    const response = await api.post<ApiEnvelope<AuthResponse>>('/auth/register', { email, password });
    return establishSession(unwrap(response));
  }, [establishSession]);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  const value = useMemo<AuthContextValue>(() => ({
    user,
    isLoading,
    isAuthenticated: Boolean(user),
    login,
    register,
    logout,
  }), [user, isLoading, login, register, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
