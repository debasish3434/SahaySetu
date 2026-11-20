import { createContext, useState, useEffect, useCallback } from 'react';
import { loginApi, registerApi, getMeApi } from '../api/authApi.js';

export const AuthContext = createContext(null);

/**
 * Provides authentication state (user, token) and actions (login, register, logout)
 * to the entire app. Persists token in localStorage and rehydrates user on refresh.
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount, verify existing token and fetch current user
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('sahaySetuToken');
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await getMeApi();
        setUser(data.user);
      } catch (err) {
        localStorage.removeItem('sahaySetuToken');
        localStorage.removeItem('sahaySetuUser');
      } finally {
        setLoading(false);
      }
    };
    bootstrapAuth();
  }, []);

  const persistSession = (token, userData) => {
    localStorage.setItem('sahaySetuToken', token);
    localStorage.setItem('sahaySetuUser', JSON.stringify(userData));
    setUser(userData);
  };

  const adoptSession = useCallback((token, userData) => {
    localStorage.setItem('sahaySetuToken', token);
    localStorage.setItem('sahaySetuUser', JSON.stringify(userData));
    setUser(userData);
  }, []);

  const login = useCallback(async (credentials) => {
    const { data } = await loginApi(credentials);
    // Only persist session for fully approved users
    // Pending/rejected/deactivated get a token-less error from the server
    persistSession(data.token, data.user);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const { data } = await registerApi(payload);
    // For citizens: persist session immediately
    // For volunteers/coordinators: requiresApproval=true, no token returned
    if (data.token) {
      persistSession(data.token, data.user);
    }
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('sahaySetuToken');
    localStorage.removeItem('sahaySetuUser');
    setUser(null);
  }, []);

  const updateUserInContext = useCallback((updatedUser) => {
    setUser(updatedUser);
    localStorage.setItem('sahaySetuUser', JSON.stringify(updatedUser));
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isSuperAdmin: !!user?.isSuperAdmin,
    loading,
    login,
    register,
    logout,
    updateUserInContext,
    adoptSession,
    token: localStorage.getItem('sahaySetuToken'),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

