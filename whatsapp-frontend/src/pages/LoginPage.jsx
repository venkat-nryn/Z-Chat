import React from 'react';
import { Navigate } from 'react-router-dom';
import Login from '../components/auth/Login';
import { useAuth } from '../context/AuthContext';

const LoginPage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return <Login />;
};

export default LoginPage;
