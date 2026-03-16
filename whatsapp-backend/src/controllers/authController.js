const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');

const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

const createSendToken = (user, statusCode, res) => {
  const token = signToken(user._id);

  // Remove password from output
  user.password = undefined;

  res.status(statusCode).json({
    status: 'success',
    token,
    data: {
      user
    }
  });
};

exports.register = catchAsync(async (req, res, next) => {
  const { phoneNumber, username, password, email } = req.body;

  // Check if user exists
  const existingUser = await User.findOne({ 
    $or: [{ phoneNumber }, { username }] 
  });
  
  if (existingUser) {
    if (existingUser.phoneNumber === phoneNumber) {
      return next(new AppError('Phone number already registered', 400));
    }
    if (existingUser.username === username) {
      return next(new AppError('Username already taken', 400));
    }
  }

  // Create user
  const user = await User.create({
    phoneNumber,
    username,
    password,
    email
  });

  createSendToken(user, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
  const { phoneNumber, password } = req.body;

  // Check if phoneNumber and password exist
  if (!phoneNumber || !password) {
    return next(new AppError('Please provide phone number and password', 400));
  }

  // Check if user exists && password is correct
  const user = await User.findOne({ phoneNumber }).select('+password');

  if (!user || !(await user.comparePassword(password))) {
    return next(new AppError('Incorrect phone number or password', 401));
  }

  createSendToken(user, 200, res);
});

exports.logout = (req, res) => {
  res.status(200).json({
    status: 'success',
    message: 'Logged out successfully'
  });
};

exports.updatePassword = catchAsync(async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;

  const user = await User.findById(req.user.id).select('+password');

  if (!(await user.comparePassword(currentPassword))) {
    return next(new AppError('Current password is incorrect', 401));
  }

  user.password = newPassword;
  await user.save();

  createSendToken(user, 200, res);
});