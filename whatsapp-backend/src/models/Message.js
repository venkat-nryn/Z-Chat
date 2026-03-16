const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  conversation: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Conversation',
    required: true,
    index: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  content: {
    type: String,
    trim: true,
    maxlength: [5000, 'Message cannot exceed 5000 characters']
  },
  messageType: {
    type: String,
    enum: ['text', 'image', 'video', 'audio', 'document', 'location', 'contact'],
    default: 'text'
  },
  attachments: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Attachment'
  }],
  readBy: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    readAt: {
      type: Date,
      default: Date.now
    }
  }],
  deliveredTo: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    deliveredAt: {
      type: Date,
      default: Date.now
    }
  }],
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  forwarded: {
    type: Boolean,
    default: false
  },
  forwardedFrom: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  location: {
    latitude: Number,
    longitude: Number,
    address: String
  },
  contact: {
    name: String,
    phoneNumber: String
  },
  isDeleted: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes for efficient querying
messageSchema.index({ conversation: 1, createdAt: -1 });
messageSchema.index({ sender: 1, createdAt: -1 });

module.exports = mongoose.model('Message', messageSchema);