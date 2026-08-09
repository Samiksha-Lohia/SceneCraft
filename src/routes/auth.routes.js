import { Router } from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import * as authService from '../services/auth.service.js';
import { validate } from '../middleware/validate.middleware.js';
import { registerSchema, loginSchema, refreshSchema } from '../validators/auth.validator.js';
import { sendSuccess, sendCreated } from '../utilities/response.js';
import { redis } from '../config/redis.js';
import { ApiError } from '../utilities/custom-errors.js';

const router = Router();

// Strict Rate Limiter: 5 attempts per 15 minutes per IP + email identifier
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  store: new RedisStore({
    sendCommand: (...args) => redis.call(...args),
  }),
  keyGenerator: (req) => {
    const email = req.body?.email ? req.body.email.toString().toLowerCase().trim() : '';
    return `${ipKeyGenerator(req.ip)}:${email}`;
  },
  handler: (req, res, next) => {
    next(new ApiError(429, 'Too many login or registration attempts. Please try again after 15 minutes.'));
  },
});

/**
 * POST /api/auth/register
 * Body: { name, email, password }
 */
router.post('/register', authLimiter, validate(registerSchema), async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const result = await authService.register(name, email, password);
    sendCreated(res, result, 'Account created successfully.');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
router.post('/login', authLimiter, validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const result = await authService.login(email, password);
    sendSuccess(res, result, 200, 'Login successful.');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/refresh
 * Body: { refreshToken }
 */
router.post('/refresh', validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    const tokens = await authService.refreshTokens(refreshToken);
    sendSuccess(res, tokens, 200, 'Tokens refreshed.');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/logout
 * Body: { refreshToken }
 */
router.post('/logout', validate(refreshSchema), async (req, res, next) => {
  try {
    const { refreshToken } = req.body;
    await authService.logout(refreshToken);
    sendSuccess(res, null, 200, 'Logout successful.');
  } catch (err) {
    next(err);
  }
});

export default router;
