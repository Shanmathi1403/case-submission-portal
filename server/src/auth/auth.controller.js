const { z } = require('zod');
const authService = require('./auth.service');

const registerSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100),
  phone: z.string().regex(/^\+[1-9]\d{1,14}$/, 'Phone must be in E.164 format').optional()
});

const loginSchema = z.object({
  username: z.string().min(3).max(50),
  password: z.string().min(6).max(100)
});

const register = async (req, res, next) => {
  try {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      const errorMessage = firstError.path[0] === 'password' && firstError.code === 'too_small'
        ? 'Password must be at least 6 characters'
        : firstError.path[0] === 'username' && firstError.code === 'too_small'
        ? 'Username must be at least 3 characters'
        : 'Invalid input';
      const error = new Error(errorMessage);
      error.status = 400;
      error.details = parsed.error.errors;
      throw error;
    }

    const { username, password, phone } = parsed.data;
    const result = await authService.register(username, password, phone);

    res.status(201).json({
      token: result.token,
      user: {
        id: result.userId,
        username: result.username,
        phone: result.phone
      },
      message: 'User registered successfully'
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  try {
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) {
      const firstError = parsed.error.errors[0];
      const errorMessage = firstError.path[0] === 'password' && firstError.code === 'too_small'
        ? 'Password must be at least 6 characters'
        : firstError.path[0] === 'username' && firstError.code === 'too_small'
        ? 'Username must be at least 3 characters'
        : 'Invalid input';
      const error = new Error(errorMessage);
      error.status = 400;
      error.details = parsed.error.errors;
      throw error;
    }

    const { username, password } = parsed.data;
    const result = await authService.login(username, password);

    res.json({
      token: result.token,
      user: {
        id: result.userId,
        username: result.username,
        phone: result.phone
      },
      message: 'Login successful'
    });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  register,
  login
};
