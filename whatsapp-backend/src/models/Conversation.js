const mongoose = require('mongoose');

const conversationSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }],
  isGroup: {
    type: Boolean,
    default: false
  },
  groupName: {
    type: String,
    required: function() {
      return this.isGroup;
    }
  },
  groupAdmin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: function() {
      return this.isGroup;
    }
  },
  groupIcon: {
    type: String,
    default: null
  },
  lastMessage: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  unreadCount: {
    type: Map,
    of: Number,
    default: new Map()
  },
  mutedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  pinnedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  archivedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true
});

// Ensure exactly 2 participants for non-group chats
conversationSchema.pre('save', function() {
  if (!this.isGroup && this.participants.length !== 2) {
    throw new Error('Private conversation must have exactly 2 participants');
  }
});

// Index for faster queries
conversationSchema.index({ participants: 1 });
conversationSchema.index({ updatedAt: -1 });

module.exports = mongoose.model('Conversation', conversationSchema);