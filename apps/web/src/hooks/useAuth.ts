import { useState, useCallback } from 'react';
import api from '../lib/api';

interface User {
  id: string;
  nombre: string;
  email: string;
  rol: string;
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('inyecta_user');
    return stored ? JSON.parse(stored) : null;
  });

  const isAuthenticated = !!user;

  const login = useCallback(async (email: string, password: string) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('inyecta_token', data.token);
    localStorage.setItem('inyecta_user', JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('inyecta_token');
    localStorage.removeItem('inyecta_user');
    setUser(null);
  }, []);

  return { user, isAuthenticated, login, logout };
}
