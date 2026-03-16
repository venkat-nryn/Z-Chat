module.exports = {
  MESSAGE_TYPES: ['text', 'image', 'video', 'audio', 'document', 'location', 'contact'],
  ONLINE_STATUS: {
    ONLINE: 'online',
    OFFLINE: 'offline',
    AWAY: 'away'
  },
  SOCKET_EVENTS: {
    CONNECTION: 'connection',
    DISCONNECT: 'disconnect',
    MESSAGE: 'message',
    TYPING_START: 'typing_start',
    TYPING_STOP: 'typing_stop',
    READ_RECEIPT: 'read_receipt',
    DELIVERED: 'delivered',
    USER_ONLINE: 'user_online',
    USER_OFFLINE: 'user_offline',
    JOIN_CONVERSATION: 'join_conversation',
    LEAVE_CONVERSATION: 'leave_conversation'
  }
};