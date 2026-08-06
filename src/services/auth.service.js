import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../config/env.js';
import userRepository from '../repositories/user.repository.js';
import { BadRequestError, ConflictError, UnauthorizedError } from '../utilities/custom-errors.js';
import { UserDto } from '../dtos/user.dto.js';
import { redis } from '../config/redis.js';

/**
 * Parses JWT expiry string to seconds.
 */
const parseExpiryToSeconds = (expiry) => {
  if (typeof expiry === 'number') return expiry;
  if (!expiry) return 7 * 24 * 3600;
  const match = expiry.match(/^(\d+)([smhd])$/);
  if (!match) return 7 * 24 * 3600;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  switch (unit) {
    case 's': return value;
    case 'm': return value * 60;
    case 'h': return value * 3600;
    case 'd': return value * 86400;
    default: return value;
  }
};

/**
 * Signs a JWT access token.
 * @param {{ id: string, email: string, plan: string }} payload
 */
const signAccessToken = (payload) =>
  jwt.sign(
    { sub: payload.id, email: payload.email, plan: payload.plan },
    config.jwt.accessSecret,
    { expiresIn: config.jwt.accessExpiry }
  );

/**
 * Signs a JWT refresh token with a unique ID (jti).
 * @param {{ id: string, jti: string }} payload
 */
const signRefreshToken = (payload) =>
  jwt.sign(
    { sub: payload.id, jti: payload.jti },
    config.jwt.refreshSecret,
    { expiresIn: config.jwt.refreshExpiry }
  );

/**
 * Returns a { accessToken, refreshToken } pair for the given user,
 * registering the refresh token's jti in Redis.
 */
const generateTokenPair = async (user) => {
  const userId = (user._id || user.id).toString();
  const jti = crypto.randomUUID();
  const accessToken = signAccessToken({ id: userId, email: user.email, plan: user.plan });
  const refreshToken = signRefreshToken({ id: userId, jti });

  // Store refresh token in Redis
  const ttl = parseExpiryToSeconds(config.jwt.refreshExpiry);
  await redis.set(`refresh_token:${jti}`, userId, 'EX', ttl);

  return { accessToken, refreshToken };
};

// ─── Public Service Functions ─────────────────────────────────────────────────

/**
 * Register a new user account.
 * @returns {{ user: UserDto, tokens: { accessToken, refreshToken } }}
 */
const register = async (name, email, password) => {
  const existing = await userRepository.findByEmail(email);
  if (existing) {
    throw new ConflictError('An account with this email already exists.');
  }

  // The User model pre-save hook hashes the passwordHash field automatically.
  const user = await userRepository.create({ name, email, passwordHash: password });

  const tokens = await generateTokenPair(user);
  return { user: UserDto.toResponse(user), tokens };
};

/**
 * Authenticate a user with email + password.
 * @returns {{ user: UserDto, tokens: { accessToken, refreshToken } }}
 */
const login = async (email, password) => {
  const user = await userRepository.findByEmail(email);
  if (!user) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new UnauthorizedError('Invalid email or password.');
  }

  const tokens = await generateTokenPair(user);
  return { user: UserDto.toResponse(user), tokens };
};

/**
 * Refresh the access token using a valid refresh token.
 * @returns {{ accessToken: string, refreshToken: string }}
 */
const refreshTokens = async (refreshToken) => {
  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required.');
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token.');
  }

  // Verify the jti exists in Redis (not revoked)
  if (!payload.jti) {
    throw new UnauthorizedError('Invalid or expired refresh token.');
  }
  const storedUserId = await redis.get(`refresh_token:${payload.jti}`);
  if (!storedUserId) {
    throw new UnauthorizedError('Invalid or expired refresh token.');
  }

  const user = await userRepository.findById(payload.sub);
  if (!user) {
    throw new UnauthorizedError('User not found.');
  }

  // Revoke the old refresh token jti
  await redis.del(`refresh_token:${payload.jti}`);

  // Generate new token pair (registers a new jti)
  return generateTokenPair(user);
};

/**
 * Log out user by deleting the refresh token from Redis.
 */
const logout = async (refreshToken) => {
  if (!refreshToken) {
    throw new BadRequestError('Refresh token is required.');
  }

  let payload;
  try {
    payload = jwt.verify(refreshToken, config.jwt.refreshSecret);
  } catch {
    throw new UnauthorizedError('Invalid or expired refresh token.');
  }

  if (payload.jti) {
    await redis.del(`refresh_token:${payload.jti}`);
  }
};

export { register, login, refreshTokens, logout, generateTokenPair };
