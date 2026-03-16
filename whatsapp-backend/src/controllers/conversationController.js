const Conversation = require('../models/Conversation');
const Message = require('../models/Message');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const populateConversation = async (conversationOrQuery) => {
  if (!conversationOrQuery) {
    return conversationOrQuery;
  }

  const population = [
    { path: 'participants', select: 'username profilePicture isOnline lastSeen' },
    {
      path: 'lastMessage',
      populate: {
        path: 'sender',
        select: 'username'
      }
    }
  ];

  // Query path: chain populate calls.
  if (typeof conversationOrQuery.exec === 'function') {
    return conversationOrQuery
      .populate(population[0])
      .populate(population[1]);
  }

  // Document path: populate accepts an array config.
  if (typeof conversationOrQuery.populate === 'function') {
    await conversationOrQuery.populate(population);
  }

  return conversationOrQuery;
};

exports.getMyConversations = catchAsync(async (req, res, next) => {
  const conversations = await populateConversation(
    Conversation.find({
      participants: req.user.id
    }).sort('-updatedAt')
  );

  res.status(200).json({
    status: 'success',
    results: conversations.length,
    data: {
      conversations
    }
  });
});

exports.getConversation = catchAsync(async (req, res, next) => {
  const conversation = await populateConversation(
    Conversation.findById(req.params.id)
  );

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check if user is participant
  if (!conversation.participants.some(p => p._id.toString() === req.user.id)) {
    return next(new AppError('You are not a participant of this conversation', 403));
  }

  res.status(200).json({
    status: 'success',
    data: {
      conversation
    }
  });
});

exports.createPrivateConversation = catchAsync(async (req, res, next) => {
  const { recipientId } = req.body;

  if (recipientId === req.user.id) {
    return next(new AppError('You cannot create a conversation with yourself', 400));
  }

  // Check if recipient exists
  const recipient = await User.findById(recipientId);
  if (!recipient) {
    return next(new AppError('User not found', 404));
  }

  // Check if conversation already exists
  let conversation = await Conversation.findOne({
    isGroup: false,
    participants: { $all: [req.user.id, recipientId] },
    $expr: { $eq: [{ $size: '$participants' }, 2] }
  });

  if (!conversation) {
    conversation = await Conversation.create({
      participants: [req.user.id, recipientId],
      isGroup: false
    });
  }

  conversation = await populateConversation(conversation);

  res.status(201).json({
    status: 'success',
    data: {
      conversation
    }
  });
});

exports.createGroupConversation = catchAsync(async (req, res, next) => {
  const { groupName, participants } = req.body;
  const participantIds = [...new Set(participants.map(participant => participant.toString()))];

  // Add creator to participants if not included
  if (!participantIds.includes(req.user.id.toString())) {
    participantIds.push(req.user.id.toString());
  }

  // Check all participants exist
  const users = await User.find({ _id: { $in: participantIds } });
  if (users.length !== participantIds.length) {
    return next(new AppError('One or more participants not found', 404));
  }

  let conversation = await Conversation.create({
    participants: participantIds,
    isGroup: true,
    groupName,
    groupAdmin: req.user.id
  });

  conversation = await populateConversation(conversation);

  res.status(201).json({
    status: 'success',
    data: {
      conversation
    }
  });
});

exports.updateGroup = catchAsync(async (req, res, next) => {
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check if user is group admin
  if (conversation.groupAdmin.toString() !== req.user.id) {
    return next(new AppError('Only group admin can update group', 403));
  }

  const { groupName, groupIcon } = req.body;

  if (groupName) conversation.groupName = groupName;
  if (groupIcon) conversation.groupIcon = groupIcon;

  await conversation.save();

  res.status(200).json({
    status: 'success',
    data: {
      conversation
    }
  });
});

exports.addParticipants = catchAsync(async (req, res, next) => {
  const { participants } = req.body;
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check if user is group admin
  if (conversation.groupAdmin.toString() !== req.user.id) {
    return next(new AppError('Only group admin can add participants', 403));
  }

  // Add new participants
  participants.forEach(p => {
    if (!conversation.participants.some(existing => existing.toString() === p.toString())) {
      conversation.participants.push(p);
    }
  });

  await conversation.save();
  await populateConversation(conversation);

  res.status(200).json({
    status: 'success',
    data: {
      conversation
    }
  });
});

exports.removeParticipant = catchAsync(async (req, res, next) => {
  const { userId } = req.params;
  const conversation = await Conversation.findById(req.params.id);

  if (!conversation) {
    return next(new AppError('Conversation not found', 404));
  }

  // Check if user is group admin
  if (conversation.groupAdmin.toString() !== req.user.id) {
    return next(new AppError('Only group admin can remove participants', 403));
  }

  conversation.participants = conversation.participants.filter(
    p => p.toString() !== userId
  );

  await conversation.save();
  await populateConversation(conversation);

  res.status(200).json({
    status: 'success',
    data: {
      conversation
    }
  });
});