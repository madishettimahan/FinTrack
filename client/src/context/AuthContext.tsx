import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, confirmPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; currency?: string }) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);
export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) { setLoading(false); return; }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data.data.user);
    } catch { localStorage.removeItem('accessToken'); }
    setLoading(false);
  }, []);

  useEffect(() => { checkAuth(); }, [checkAuth]);

  const login = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    localStorage.setItem('accessToken', res.data.data.accessToken);
    setUser(res.data.data.user);
  };

  const register = async (name: string, email: string, password: string, confirmPassword: string) => {
    const res = await api.post('/auth/register', { name, email, password, confirmPassword });
    localStorage.setItem('accessToken', res.data.data.accessToken);
    setUser(res.data.data.user);
  };

  const logout = async () => {
    try { await api.post('/auth/logout'); } catch {}
    localStorage.removeItem('accessToken');
    setUser(null);
  };

  const updateProfile = async (data: { name?: string; currency?: string }) => {
    const res = await api.put('/auth/profile', data);
    setUser(res.data.data.user);
  };

  return (
    <AuthContext.Provider value={{ user, loading, isAuthenticated: !!user, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
