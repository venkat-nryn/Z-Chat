/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { messageService } from '../services/messageService';
import { conversationService } from '../services/conversationService';
import { useSocket } from './SocketContext';
import { useAuth } from './AuthContext';

const ChatContext = createContext();

export const useChat = () => useContext(ChatContext);

const sortConversations = (conversationList) => {
  return [...conversationList].sort(
    (firstConversation, secondConversation) =>
      new Date(secondConversation.updatedAt || 0) - new Date(firstConversation.updatedAt || 0)
  );
};

export const ChatProvider = ({ children }) => {
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const { socket, sendReadReceipt, joinConversations } = useSocket();
  const { user, isAuthenticated } = useAuth();

  const resetChatState = useCallback(() => {
    setConversations([]);
    setCurrentConversation(null);
    setMessages([]);
    setLoading(false);
    setError(null);
  }, []);

  useEffect(() => {
    resetChatState();
  }, [resetChatState, user?._id]);

  useEffect(() => {
    if (!socket || conversations.length === 0) {
      return;
    }

    joinConversations(conversations.map((conversation) => conversation._id));
  }, [socket, conversations, joinConversations]);

  const upsertConversation = useCallback((conversation) => {
    if (!conversation) {
      return null;
    }

    setConversations((previousConversations) => {
      const remainingConversations = previousConversations.filter(
        (existingConversation) => existingConversation._id !== conversation._id
      );

      return sortConversations([conversation, ...remainingConversations]);
    });

    setCurrentConversation((previousConversation) => {
      if (previousConversation?._id === conversation._id) {
        return conversation;
      }

      return previousConversation;
    });

    return conversation;
  }, []);

  const loadConversations = useCallback(async () => {
    if (!isAuthenticated) {
      resetChatState();
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const response = await conversationService.getConversations();
      const nextConversations = sortConversations(response.data?.conversations || []);

      setConversations(nextConversations);
      setCurrentConversation((previousConversation) => {
        if (!previousConversation) {
          return null;
        }

        return (
          nextConversations.find(
            (conversation) => conversation._id === previousConversation._id
          ) || null
        );
      });

      return nextConversations;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to load conversations');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, resetChatState]);

  const loadMessages = useCallback(async (conversationId, page = 1) => {
    if (!conversationId) {
      setMessages([]);
      return { messages: [], pagination: null };
    }

    try {
      setLoading(true);
      setError(null);

      if (page === 1) {
        setMessages([]);
      }

      const response = await messageService.getMessages(conversationId, page);
      const nextMessages = response.data?.data?.messages || [];

      setMessages((previousMessages) =>
        page === 1 ? nextMessages : [...previousMessages, ...nextMessages]
      );

      return response.data?.data || { messages: nextMessages, pagination: null };
    } catch (err) {
      if (page === 1) {
        setMessages([]);
      }
      setError(err.response?.data?.message || err.message || 'Failed to load messages');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const sendMessage = useCallback(async (data, files = []) => {
    try {
      setError(null);
      const response = await messageService.sendMessage(data, files);
      const newMessage = response.data?.data?.message;

      if (!newMessage) {
        throw new Error('Message was not returned by server');
      }

      setMessages((previousMessages) => [newMessage, ...previousMessages]);

      setConversations((previousConversations) => {
        const matchingConversation = previousConversations.find(
          (conversation) => conversation._id === data.conversationId
        );

        if (!matchingConversation) {
          return previousConversations;
        }

        return sortConversations([
          {
            ...matchingConversation,
            lastMessage: newMessage,
            updatedAt: newMessage.createdAt,
          },
          ...previousConversations.filter(
            (conversation) => conversation._id !== data.conversationId
          ),
        ]);
      });

      setCurrentConversation((previousConversation) => {
        if (previousConversation?._id !== data.conversationId) {
          return previousConversation;
        }

        return {
          ...previousConversation,
          lastMessage: newMessage,
          updatedAt: newMessage.createdAt,
        };
      });

      return newMessage;
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Failed to send message');
      throw err;
    }
  }, []);

  const markAsRead = useCallback(async (conversationId, messageIds) => {
    if (!conversationId || !messageIds?.length || !user?._id) {
      return;
    }

    try {
      await messageService.markAsRead(conversationId, messageIds);
      sendReadReceipt(conversationId, messageIds);

      setMessages((previousMessages) =>
        previousMessages.map((message) =>
          messageIds.includes(message._id)
            ? { ...message, readBy: [...(message.readBy || []), { user: user._id }] }
            : message
        )
      );

      setConversations((previousConversations) =>
        previousConversations.map((conversation) =>
          conversation._id === conversationId
            ? {
                ...conversation,
                unreadCount: {
                  ...(conversation.unreadCount || {}),
                  [user._id]: 0,
                },
              }
            : conversation
        )
      );
    } catch (err) {
      console.error('Failed to mark messages as read:', err);
    }
  }, [sendReadReceipt, user?._id]);

  const selectConversation = useCallback(async (conversation) => {
    if (!conversation) {
      setCurrentConversation(null);
      setMessages([]);
      return null;
    }

    setCurrentConversation(conversation);
    const response = await loadMessages(conversation._id);

    if (user?._id && conversation.unreadCount?.[user._id] > 0) {
      setConversations((previousConversations) =>
        previousConversations.map((existingConversation) =>
          existingConversation._id === conversation._id
            ? {
                ...existingConversation,
                unreadCount: {
                  ...(existingConversation.unreadCount || {}),
                  [user._id]: 0,
                },
              }
            : existingConversation
        )
      );
    }

    return response;
  }, [loadMessages, user?._id]);

  const value = {
    conversations,
    currentConversation,
    messages,
    loading,
    error,
    loadConversations,
    loadMessages,
    sendMessage,
    markAsRead,
    selectConversation,
    upsertConversation,
    resetChatState,
    setCurrentConversation,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
