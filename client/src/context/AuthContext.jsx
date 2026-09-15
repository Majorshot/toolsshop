import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('vpt_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('vpt_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vpt_user');
    }
  }, [user]);

  const login = async (role, identifier, password, name, extra = {}) => {
    const payload = typeof role === 'object' ? role : { role, identifier, password, name, ...extra };
    const res = await api.login(payload);
    if (res.success && res.user) {
      setUser(res.user);
      return res.user;
    } else {
      throw new Error(res.message || 'Login failed');
    }
  };

  const register = async (data) => {
    const res = await api.register(data);
    if (res.success && res.user) {
      setUser(res.user);
      return res.user;
    } else {
      throw new Error(res.message || 'Registration failed');
    }
  };


  const logout = () => {
    setUser(null);
  };

  const updateUser = (updates) => {
    setUser(prev => {
      if (!prev) return updates;
      const updated = { ...prev, ...updates };
      try {
        localStorage.setItem('vpt_user', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const isStoreOwner = user?.role === 'store';
  const isCustomer = user?.role === 'customer';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoggedIn: !!user,
        isStoreOwner,
        isCustomer,
        login,
        register,
        logout,
        updateUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

const defaultAuthContext = {
  user: null,
  isLoggedIn: false,
  isStoreOwner: false,
  isCustomer: false,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  updateUser: () => {}
};

export const useAuth = () => useContext(AuthContext) || defaultAuthContext;
