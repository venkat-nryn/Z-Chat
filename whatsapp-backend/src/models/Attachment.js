const mongoose = require('mongoose');

const attachmentSchema = new mongoose.Schema({
  message: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message',
    required: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  thumbnailPath: {
    type: String
  },
  duration: {
    type: Number // For audio/video
  },
  dimensions: {
    width: Number,
    height: Number
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Attachment', attachmentSchema);