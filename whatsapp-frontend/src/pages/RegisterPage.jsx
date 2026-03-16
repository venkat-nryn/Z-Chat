import React from 'react';
import { Navigate } from 'react-router-dom';
import Register from '../components/auth/Register';
import { useAuth } from '../context/AuthContext';

const RegisterPage = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/chat" replace />;
  }

  return <Register />;
};

export default RegisterPage;
