import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../services/api';

const AuthContext = createContext(null);

const CURRENCY_SYMBOLS = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  INR: '₹',
  CAD: 'CA$',
  AUD: 'AU$',
  JPY: '¥',
  CHF: 'CHF',
  SGD: 'SG$',
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [loading, setLoading] = useState(true);

  // Sync profile on mount if token is present
  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('token');
      if (!storedToken) {
        setLoading(false);
        return;
      }

      try {
        const res = await authApi.getProfile();
        if (res.data && res.data.success) {
          setUser(res.data.data);
          localStorage.setItem('user', JSON.stringify(res.data.data));
        }
      } catch (err) {
        console.error('Session expired or invalid token:', err);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, []);

  const login = async (email, password) => {
    const res = await authApi.login({ email, password });
    if (res.data && res.data.success) {
      const authData = res.data.data;
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData));
      setToken(authData.token);
      setUser(authData);
      return authData;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (userData) => {
    const res = await authApi.register(userData);
    if (res.data && res.data.success) {
      const authData = res.data.data;
      localStorage.setItem('token', authData.token);
      localStorage.setItem('user', JSON.stringify(authData));
      setToken(authData.token);
      setUser(authData);
      return authData;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = async (data) => {
    const res = await authApi.updateProfile(data);
    if (res.data && res.data.success) {
      const updated = res.data.data;
      setUser((prev) => ({ ...prev, ...updated }));
      localStorage.setItem('user', JSON.stringify({ ...user, ...updated }));
      return updated;
    }
    throw new Error(res.data.message || 'Update failed');
  };

  const formatCurrency = useCallback((amount) => {
    const currCode = user?.currency || 'USD';
    const symbol = CURRENCY_SYMBOLS[currCode] || '$';
    const num = Number(amount) || 0;
    return `${symbol}${num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }, [user]);

  const currencySymbol = CURRENCY_SYMBOLS[user?.currency || 'USD'] || '$';

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        updateProfile,
        formatCurrency,
        currencySymbol,
        currencyCode: user?.currency || 'USD',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
