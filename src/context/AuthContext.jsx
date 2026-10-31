import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    try {
      const data = await api.getMe();
      setUser(data);
    } catch (err) {
      setUser(null);
      localStorage.removeItem('questify_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('questify_token');
    if (token) {
      refreshUser();
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const res = await api.login(email, password);
    localStorage.setItem('questify_token', res.access_token);
    setUser(res.user);
    return res.user;
  };

  const register = async (fullName, email, password) => {
    const res = await api.register(fullName, email, password);
    localStorage.setItem('questify_token', res.access_token);
    setUser(res.user);
    return res.user;
  };

  const loginDemo = async () => {
    const res = await api.demoLogin();
    localStorage.setItem('questify_token', res.access_token);
    setUser(res.user);
    return res.user;
  };

  const logout = () => {
    localStorage.removeItem('questify_token');
    setUser(null);
  };

  const updateLocalXP = (newXp, newLevel, newTitle) => {
    if (user) {
      setUser(prev => ({
        ...prev,
        xp: newXp,
        level: newLevel,
        level_title: newTitle,
      }));
    }
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      login,
      register,
      loginDemo,
      logout,
      refreshUser,
      updateLocalXP,
      isAuthenticated: !!user,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
