import jwt from 'jsonwebtoken';
import config from '../config/env.js';
import { UnauthorizedError } from '../utilities/custom-errors.js';

/**
 * Verifies the Bearer JWT access token in the Authorization header.
 * Attaches `req.user = { id, email, plan }` on success.
 */
const authenticate = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Access token missing or malformed.');
    }

    const token = authHeader.split(' ')[1];
    const payload = jwt.verify(token, config.jwt.accessSecret);

    req.user = {
      id: payload.sub,
      email: payload.email,
      plan: payload.plan,
    };

    next();
  } catch (err) {
    if (err instanceof UnauthorizedError) return next(err);
    // JsonWebTokenError / TokenExpiredError
    next(new UnauthorizedError('Invalid or expired access token.'));
  }
};

export { authenticate };
