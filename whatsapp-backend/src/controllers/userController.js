const mongoose = require('mongoose');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const fs = require('fs');
const path = require('path');

const publicUserFields = 'username phoneNumber profilePicture status isOnline lastSeen';

const formatPublicUser = (user) => ({
  _id: user._id,
  username: user.username,
  phoneNumber: user.phoneNumber,
  profilePicture: user.profilePicture,
  status: user.status,
  isOnline: user.isOnline,
  lastSeen: user.lastSeen
});

exports.getMe = (req, res, next) => {
  req.params.id = req.user.id;
  next();
};

exports.getUser = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return next(new AppError('No user found with that ID', 404));
  }

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.updateMe = catchAsync(async (req, res, next) => {
  // Filter out unwanted fields
  const filteredBody = {};
  const allowedFields = ['username', 'email', 'status', 'profilePicture'];
  
  Object.keys(req.body).forEach(key => {
    if (allowedFields.includes(key)) {
      filteredBody[key] = req.body[key];
    }
  });

  // Update user
  const user = await User.findByIdAndUpdate(req.user.id, filteredBody, {
    new: true,
    runValidators: true
  });

  res.status(200).json({
    status: 'success',
    data: {
      user
    }
  });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
  await User.findByIdAndDelete(req.user.id);

  res.status(204).json({
    status: 'success',
    data: null
  });
});

exports.uploadProfilePicture = catchAsync(async (req, res, next) => {
  if (!req.files || req.files.length === 0) {
    return next(new AppError('Please upload a file', 400));
  }

  const file = req.files[0];
  const projectRoot = path.join(__dirname, '../../');
  const relativePath = path.relative(projectRoot, file.path);
  const profilePicturePath = relativePath.replace(/\\/g, '/');

  // Delete old profile picture if exists
  const user = await User.findById(req.user.id);
  if (user.profilePicture) {
    const normalizedOldPath = user.profilePicture.replace(/\\/g, '/').replace(/^\/+/, '');
    const oldPath = path.join(projectRoot, normalizedOldPath);
    if (fs.existsSync(oldPath)) {
      fs.unlinkSync(oldPath);
    }
  }

  // Update user with new profile picture
  user.profilePicture = profilePicturePath;
  await user.save();

  res.status(200).json({
    status: 'success',
    data: {
      profilePicture: profilePicturePath
    }
  });
});

exports.addContact = catchAsync(async (req, res, next) => {
  const { contactId } = req.body;

  // Prevent adding yourself
  if (contactId === req.user.id) {
    return next(new AppError('You cannot add yourself as a contact', 400));
  }

  // Check if valid MongoDB ID
  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return next(new AppError('Invalid contact ID format', 400));
  }

  // Check if contact exists
  const contact = await User.findById(contactId);
  if (!contact) {
    return next(new AppError('User not found', 404));
  }

  // Get current user
  const currentUser = await User.findById(req.user.id);

  // Check if already in contacts
  if (currentUser.contacts.some(contact => contact.toString() === contactId)) {
    return next(new AppError('Contact already exists in your list', 400));
  }

  // Add contact to current user's contacts (one-way)
  currentUser.contacts.push(contactId);
  await currentUser.save();

  // Automatically add current user to contact's contacts (two-way)
  if (!contact.contacts.some(existingContact => existingContact.toString() === req.user.id.toString())) {
    contact.contacts.push(req.user.id);
    await contact.save();
  }

  res.status(200).json({
    status: 'success',
    message: 'Contact added successfully',
    data: {
      contact: formatPublicUser(contact)
    }
  });
});

exports.getContacts = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('contacts', publicUserFields);

  res.status(200).json({
    status: 'success',
    results: user.contacts.length,
    data: {
      contacts: user.contacts
    }
  });
});

exports.removeContact = catchAsync(async (req, res, next) => {
  const { contactId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(contactId)) {
    return next(new AppError('Invalid contact ID format', 400));
  }

  const [currentUser, contact] = await Promise.all([
    User.findById(req.user.id),
    User.findById(contactId)
  ]);

  if (!contact) {
    return next(new AppError('User not found', 404));
  }

  currentUser.contacts = currentUser.contacts.filter(
    existingContact => existingContact.toString() !== contactId
  );
  contact.contacts = contact.contacts.filter(
    existingContact => existingContact.toString() !== req.user.id.toString()
  );

  await Promise.all([currentUser.save(), contact.save()]);

  res.status(200).json({
    status: 'success',
    message: 'Contact removed successfully'
  });
});

exports.blockUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  if (userId === req.user.id) {
    return next(new AppError('You cannot block yourself', 400));
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  const [currentUser, userToBlock] = await Promise.all([
    User.findById(req.user.id),
    User.findById(userId)
  ]);

  if (!userToBlock) {
    return next(new AppError('User not found', 404));
  }

  if (!currentUser.blockedUsers.some(blockedUser => blockedUser.toString() === userId)) {
    currentUser.blockedUsers.push(userId);
  }

  currentUser.contacts = currentUser.contacts.filter(
    contact => contact.toString() !== userId
  );
  userToBlock.contacts = userToBlock.contacts.filter(
    contact => contact.toString() !== req.user.id.toString()
  );

  await Promise.all([currentUser.save(), userToBlock.save()]);

  res.status(200).json({
    status: 'success',
    message: 'User blocked successfully'
  });
});

exports.unblockUser = catchAsync(async (req, res, next) => {
  const { userId } = req.params;

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return next(new AppError('Invalid user ID format', 400));
  }

  const currentUser = await User.findById(req.user.id);
  currentUser.blockedUsers = currentUser.blockedUsers.filter(
    blockedUser => blockedUser.toString() !== userId
  );
  await currentUser.save();

  res.status(200).json({
    status: 'success',
    message: 'User unblocked successfully'
  });
});

exports.getBlockedUsers = catchAsync(async (req, res, next) => {
  const user = await User.findById(req.user.id).populate('blockedUsers', publicUserFields);

  res.status(200).json({
    status: 'success',
    results: user.blockedUsers.length,
    data: {
      blockedUsers: user.blockedUsers.map(formatPublicUser)
    }
  });
});

exports.searchUsers = catchAsync(async (req, res, next) => {
  const { query } = req.query;

  if (!query?.trim()) {
    return res.status(200).json({
      status: 'success',
      results: 0,
      data: {
        users: []
      }
    });
  }

  const users = await User.find({
    $and: [
      { _id: { $ne: req.user.id } },
      {
        $or: [
          { username: { $regex: query, $options: 'i' } },
          { phoneNumber: { $regex: query, $options: 'i' } }
        ]
      }
    ]
  }).limit(20);

  res.status(200).json({
    status: 'success',
    results: users.length,
    data: {
      users
    }
  });
});