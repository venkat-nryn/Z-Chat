const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const Attachment = require('../models/Attachment');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const isParticipant = (conversation, userId) => {
  return conversation.participants.some(
    participant => participant.toString() === userId.toString()
  );
};

exports.sendMessage = catchAsync(async (req, res, next) => {
  const { conversationId, content, messageType = 'text', replyTo } = req.body;

  // Check if conversation exists and user is participant
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  if (!isParticipant(conversation, req.user.id)) {
    return next(new AppError('You are not a participant of this conversation', 403));
  }

  if (!content?.trim() && (!req.files || req.files.length === 0)) {
    return next(new AppError('Message content or an attachment is required', 400));
  }

  // Create message
  const messageData = {
    conversation: conversationId,
    sender: req.user.id,
    content: content?.trim(),
    messageType,
    replyTo
  };

  // Handle attachments if any
  if (req.files && req.files.length > 0) {
    const attachments = [];
    
    for (const file of req.files) {
      const attachment = await Attachment.create({
        message: null, // Will update after message creation
        fileName: file.originalname,
        fileType: file.mimetype,
        fileSize: file.size,
        filePath: file.path
      });
      attachments.push(attachment._id);
    }
    
    messageData.attachments = attachments;
  }

  const message = await Message.create(messageData);

  // Update attachments with message ID
  if (message.attachments.length > 0) {
    await Attachment.updateMany(
      { _id: { $in: message.attachments } },
      { message: message._id }
    );
  }

  // Update conversation's last message
  conversation.lastMessage = message._id;
  
  // Initialize unread count for each participant
  conversation.participants.forEach(participant => {
    if (participant.toString() !== req.user.id.toString()) {
      const currentCount = conversation.unreadCount.get(participant.toString()) || 0;
      conversation.unreadCount.set(participant.toString(), currentCount + 1);
    }
  });
  
  await conversation.save();

  // Populate message
  await message.populate([
    { path: 'sender', select: 'username profilePicture' },
    { path: 'attachments' },
    { path: 'replyTo', populate: { path: 'sender', select: 'username' } }
  ]);

  res.status(201).json({
    status: 'success',
    data: {
      message
    }
  });
});

exports.getMessages = catchAsync(async (req, res, next) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 50 } = req.query;

  // Check if user is participant
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: req.user.id
  });

  if (!conversation) {
    return next(new AppError('Conversation not found or access denied', 404));
  }

  const messages = await Message.find({
    conversation: conversationId,
    deletedFor: { $ne: req.user.id }
  })
  .sort('-createdAt')
  .skip((page - 1) * limit)
  .limit(parseInt(limit))
  .populate('sender', 'username profilePicture')
  .populate('attachments')
  .populate({
    path: 'replyTo',
    populate: { path: 'sender', select: 'username' }
  });

  const total = await Message.countDocuments({
    conversation: conversationId,
    deletedFor: { $ne: req.user.id }
  });

  res.status(200).json({
    status: 'success',
    data: {
      messages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    }
  });
});

exports.markAsRead = catchAsync(async (req, res, next) => {
  const { messageIds } = req.body;
  const { conversationId } = req.params;

  // Update messages
  await Message.updateMany(
    {
      _id: { $in: messageIds },
      conversation: conversationId,
      'readBy.user': { $ne: req.user.id }
    },
    {
      $addToSet: {
        readBy: {
          user: req.user.id,
          readAt: new Date()
        }
      }
    }
  );

  // Reset unread count for this user in conversation
  await Conversation.updateOne(
    { _id: conversationId },
    { $set: { [`unreadCount.${req.user.id}`]: 0 } }
  );

  res.status(200).json({
    status: 'success',
    message: 'Messages marked as read'
  });
});

exports.markAsDelivered = catchAsync(async (req, res, next) => {
  const { messageIds } = req.body;
  const { conversationId } = req.params;

  await Message.updateMany(
    {
      _id: { $in: messageIds },
      conversation: conversationId,
      'deliveredTo.user': { $ne: req.user.id }
    },
    {
      $addToSet: {
        deliveredTo: {
          user: req.user.id,
          deliveredAt: new Date()
        }
      }
    }
  );

  res.status(200).json({
    status: 'success',
    message: 'Messages marked as delivered'
  });
});

exports.deleteMessage = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { deleteForEveryone = false } = req.body;

  const message = await Message.findById(id);

  if (!message) {
    return next(new AppError('Message not found', 404));
  }

  // Check if user is sender
  if (message.sender.toString() !== req.user.id && deleteForEveryone) {
    return next(new AppError('You can only delete your own messages for everyone', 403));
  }

  if (deleteForEveryone) {
    // Delete for everyone (soft delete)
    message.isDeleted = true;
    message.content = 'This message was deleted';
    await message.save();
  } else {
    // Delete only for current user
    await Message.findByIdAndUpdate(id, {
      $addToSet: { deletedFor: req.user.id }
    });
  }

  res.status(200).json({
    status: 'success',
    message: 'Message deleted successfully'
  });
});