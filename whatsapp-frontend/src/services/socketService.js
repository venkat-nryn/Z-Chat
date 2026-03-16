import { io } from 'socket.io-client';

class SocketService {
  constructor() {
    this.socket = null;
  }

  connect(token) {
    // Use environment variable for socket URL
    const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';
    
    this.socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket', 'polling'], // Add polling fallback for production
      path: '/socket.io',
    });

    this.socket.on('connect', () => {
      console.log('Socket connected');
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  emit(event, data) {
    if (this.socket) {
      this.socket.emit(event, data);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  // Chat events
  joinConversations(conversationIds) {
    this.emit('join_conversations', conversationIds);
  }

  sendTypingStart(conversationId) {
    this.emit('typing_start', { conversationId });
  }

  sendTypingStop(conversationId) {
    this.emit('typing_stop', { conversationId });
  }

  sendReadReceipt(conversationId, messageIds) {
    this.emit('messages_read', { conversationId, messageIds });
  }
}

export default new SocketService();