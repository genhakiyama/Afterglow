import { createContext, useContext, useMemo, useState } from 'react';
import { api, getToken, setToken, clearToken, decodeToken } from '../api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => decodeToken(getToken()));

  const login = async ({ email, username, password }) => {
    const payload = await api.login({ email, username, password });
    // Backend puts the token under payload.token (watch for its `sucess` typo — we only read payload).
    setToken(payload.token);
    setUser(decodeToken(payload.token));
    return payload;
  };

  const signup = async ({ email, username, password }) => api.signup({ email, username, password });

  const logout = () => {
    clearToken();
    setUser(null);
  };

  const value = useMemo(() => ({ user, isAuthenticated: !!user, login, signup, logout }), [user]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
