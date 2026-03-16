import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { ChatProvider } from './context/ChatContext';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ChatPage from './pages/ChatPage';
import ContactsPage from './pages/ContactsPage';
import ProfilePage from './pages/ProfilePage';
import Navigation from './components/common/Navbar';
import ProtectedRoute from './components/auth/ProtectedRoute';
import 'bootstrap/dist/css/bootstrap.min.css';
import './App.css';

function App() {
  return (
    <Router>
      <AuthProvider>
        <SocketProvider>
          <ChatProvider>
            <div className="App">
              <Navigation />
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <ChatPage />
                  </ProtectedRoute>
                } />
                <Route path="/contacts" element={
                  <ProtectedRoute>
                    <ContactsPage />
                  </ProtectedRoute>
                } />
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } />
                <Route path="/" element={<Navigate to="/login" replace />} />
              </Routes>
            </div>
          </ChatProvider>
        </SocketProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;