/* eslint-disable react-refresh/only-export-components, react-hooks/set-state-in-effect */
import React, { createContext, useContext, useEffect, useState } from 'react';
import socketService from '../services/socketService';
import { useAuth } from './AuthContext';

const SocketContext = createContext();

export const useSocket = () => useContext(SocketContext);

export const SocketProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [onlineUsers, setOnlineUsers] = useState(new Set());
  const [typingUsers, setTypingUsers] = useState({});

  useEffect(() => {
    if (isAuthenticated && user) {
      const token = localStorage.getItem('token');
      socketService.connect(token);

      // Listen for online users
      socketService.on('user_online', ({ userId }) => {
        setOnlineUsers(prev => new Set(prev).add(userId));
      });

      socketService.on('user_offline', ({ userId }) => {
        setOnlineUsers(prev => {
          const newSet = new Set(prev);
          newSet.delete(userId);
          return newSet;
        });
      });

      // Listen for typing indicators
      socketService.on('user_typing', ({ conversationId, userId, isTyping }) => {
        setTypingUsers(prev => ({
          ...prev,
          [conversationId]: isTyping ? userId : null,
        }));
      });

      return () => {
        socketService.disconnect();
      };
    }

    socketService.disconnect();
    setOnlineUsers(new Set());
    setTypingUsers({});
  }, [isAuthenticated, user]);

  const value = {
    socket: socketService.socket,
    onlineUsers,
    typingUsers,
    emit: (...args) => socketService.emit(...args),
    on: (...args) => socketService.on(...args),
    off: (...args) => socketService.off(...args),
    joinConversations: (...args) => socketService.joinConversations(...args),
    sendTypingStart: (...args) => socketService.sendTypingStart(...args),
    sendTypingStop: (...args) => socketService.sendTypingStop(...args),
    sendReadReceipt: (...args) => socketService.sendReadReceipt(...args),
  };

  return <SocketContext.Provider value={value}>{children}</SocketContext.Provider>;
};