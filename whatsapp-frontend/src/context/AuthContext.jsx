/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useState, useContext } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading] = useState(false);
  const [error, setError] = useState(null);

  const login = async (credentials) => {
    try {
      setError(null);
      const response = await authService.login(credentials);
      const loggedInUser = response?.data?.user || authService.getCurrentUser();
      setUser(loggedInUser || null);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      setError(null);
      const response = await authService.register(userData);
      const registeredUser = response?.data?.user || authService.getCurrentUser();
      setUser(registeredUser || null);
      return response;
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const value = {
    user,
    loading,
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};