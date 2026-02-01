const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const usersRepository = require('../users/users.repository');
const env = require('../config/env');
const logger = require('../utils/logger');

usersRepository.initDb();

const generateToken = (userId, username) => {
  return jwt.sign({ userId, username }, env.JWT_SECRET, {
    expiresIn: '7d'
  });
};

const register = async (username, password, phone) => {
  const existingUser = await usersRepository.getUserByUsername(username);
  if (existingUser) {
    const error = new Error('Username already exists');
    error.status = 409;
    throw error;
  }

  if (password.length < 6) {
    const error = new Error('Password must be at least 6 characters');
    error.status = 400;
    throw error;
  }

  if (phone) {
    const e164Pattern = /^\+[1-9]\d{1,14}$/;
    if (!e164Pattern.test(phone)) {
      const error = new Error('Phone must be in E.164 format (e.g., +6591234567)');
      error.status = 400;
      throw error;
    }
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const userId = uuidv4();

  await usersRepository.insertUser({
    id: userId,
    username,
    passwordHash,
    phone
  });

  const token = generateToken(userId, username);

  logger.info('User registered', { userId, username });

  return { token, userId, username, phone };
};

const login = async (username, password) => {
  const user = await usersRepository.getUserByUsername(username);
  
  if (!user) {
    const error = new Error('Invalid username or password');
    error.status = 401;
    throw error;
  }

  const isValidPassword = await bcrypt.compare(password, user.password_hash);
  
  if (!isValidPassword) {
    const error = new Error('Invalid username or password');
    error.status = 401;
    throw error;
  }

  const token = generateToken(user.id, user.username);

  logger.info('User logged in', { userId: user.id, username: user.username });

  return { token, userId: user.id, username: user.username, phone: user.phone };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, env.JWT_SECRET);
  } catch (err) {
    const error = new Error('Invalid or expired token');
    error.status = 401;
    throw error;
  }
};

module.exports = {
  register,
  login,
  verifyToken
};
