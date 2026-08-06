import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import userRepository from '../repositories/user.repository.js';
import { BadRequestError, ConflictError, UnauthorizedError } from '../utilities/custom-errors.js';
import { UserDto } from '../dtos/user.dto.js';

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
 * Signs a JWT refresh token.
 * @param {{ id: string }} payload
 */
const signRefreshToken = (payload) =>
  jwt.sign({ sub: payload.id }, config.jwt.refreshSecret, {
    expiresIn: config.jwt.refreshExpiry,
  });

/**
 * Returns a { accessToken, refreshToken } pair for the given user id.
 */
const generateTokenPair = (user) => ({
  accessToken: signAccessToken({ id: user._id || user.id, email: user.email, plan: user.plan }),
  refreshToken: signRefreshToken({ id: user._id || user.id }),
});

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

  const tokens = generateTokenPair(user);
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

  const tokens = generateTokenPair(user);
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

  const user = await userRepository.findById(payload.sub);
  if (!user) {
    throw new UnauthorizedError('User not found.');
  }

  return generateTokenPair(user);
};

export { register, login, refreshTokens, generateTokenPair };
