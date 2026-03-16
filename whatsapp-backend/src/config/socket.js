const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const connectedUsers = new Map();

const allowedOrigins = [...new Set([
  'http://localhost:3000',
  'http://localhost:5173',
  ...(process.env.CORS_ORIGIN || '')
    .split(',')
    .map(origin => origin.trim())
    .filter(Boolean)
])];

const configureSocket = (server) => {
  const io = socketIO(server, {
    cors: {
      origin: allowedOrigins,
      credentials: true
    },
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authentication middleware for socket
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth.token;
      
      if (!token) {
        return next(new Error('Authentication required'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      
      if (!user) {
        return next(new Error('User not found'));
      }

      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.user.username}`);
    
    // Store user connection
    connectedUsers.set(socket.user._id.toString(), {
      socketId: socket.id,
      userId: socket.user._id,
      username: socket.user.username
    });

    // Update user online status
    User.findByIdAndUpdate(socket.user._id, { 
      isOnline: true,
      lastSeen: new Date()
    }).exec();

    // Broadcast online status to contacts
    socket.broadcast.emit('user_online', {
      userId: socket.user._id,
      isOnline: true
    });

    // Join user to their rooms (conversations)
    socket.on('join_conversations', (conversationIds) => {
      conversationIds.forEach(convId => {
        socket.join(`conversation:${convId}`);
      });
    });

    // Handle typing indicators
    socket.on('typing_start', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId: socket.user._id,
        username: socket.user.username,
        isTyping: true
      });
    });

    socket.on('typing_stop', ({ conversationId }) => {
      socket.to(`conversation:${conversationId}`).emit('user_typing', {
        conversationId,
        userId: socket.user._id,
        username: socket.user.username,
        isTyping: false
      });
    });

    // Handle read receipts
    socket.on('messages_read', async ({ conversationId, messageIds }) => {
      // Update read status in database
      // Emit to other participants
      socket.to(`conversation:${conversationId}`).emit('messages_read_status', {
        conversationId,
        userId: socket.user._id,
        messageIds,
        readAt: new Date()
      });
    });

    // Handle disconnection
    socket.on('disconnect', async () => {
      console.log(`User disconnected: ${socket.user.username}`);
      
      connectedUsers.delete(socket.user._id.toString());
      
      // Update user offline status
      await User.findByIdAndUpdate(socket.user._id, { 
        isOnline: false,
        lastSeen: new Date()
      });

      // Broadcast offline status
      socket.broadcast.emit('user_offline', {
        userId: socket.user._id,
        lastSeen: new Date()
      });
    });
  });

  return { io, connectedUsers };
};

module.exports = configureSocket;