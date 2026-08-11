import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import mongoose from 'mongoose';
import { redis } from './config/redis.js';

import config from './config/env.js';
import logger from './utilities/logger.js';
import { errorHandler, notFoundHandler } from './middleware/error.middleware.js';
import router from './routes/index.js';

const createApp = () => {
  const app = express();

  app.set('trust proxy', 1);

  // ─── Security Headers ──────────────────────────────────────────────────────
  app.use(helmet());

  // ─── CORS ──────────────────────────────────────────────────────────────────
  app.use(cors({ origin: config.corsAllowedOrigins }));

  // ─── HTTP Request Logging ──────────────────────────────────────────────────
  if (config.env !== 'test') {
    app.use(
      morgan('combined', {
        stream: { write: (message) => logger.info(message.trim()) },
      })
    );
  }

  // ─── Body Parsers ──────────────────────────────────────────────────────────
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // ─── Global Rate Limiter ───────────────────────────────────────────────────
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    limit: 200,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
      sendCommand: (...args) => redis.call(...args),
    }),
    skip: (req) => {
      // Bypass global rate limit for document jobs status checking GET endpoint
      return req.method === 'GET' && req.originalUrl && /\/api\/documents\/[^/]+\/jobs(\?|$)/.test(req.originalUrl);
    },
    message: { success: false, message: 'Too many requests, please try again later.' },
  });
  app.use('/api', limiter);

  // ─── Health Check ──────────────────────────────────────────────────────────
  app.get('/', (_req, res) => {
    res.status(200).json({
      success: true,
      message: 'SceneCraft API is running.',
      health: '/health',
      apiBase: '/api',
    });
  });

  app.get('/health', async (_req, res) => {
    try {
      const isMongoUp = mongoose.connection.readyState === 1;
      let isRedisUp = false;
      try {
        const ping = await redis.ping();
        isRedisUp = ping === 'PONG';
      } catch (err) {
        isRedisUp = false;
      }

      if (!isMongoUp || !isRedisUp) {
        return res.status(503).json({
          success: false,
          message: 'Services unavailable.',
          services: {
            mongodb: isMongoUp ? 'up' : 'down',
            redis: isRedisUp ? 'up' : 'down',
          },
        });
      }

      return res.status(200).json({
        success: true,
        message: 'SceneCraft API is running.',
        services: {
          mongodb: 'up',
          redis: 'up',
        },
      });
    } catch (err) {
      return res.status(503).json({
        success: false,
        message: 'Health check failed.',
        error: err.message,
      });
    }
  });

  // ─── API Routes ────────────────────────────────────────────────────────────
  app.use('/api', router);

  // ─── 404 Handler ──────────────────────────────────────────────────────────
  app.use(notFoundHandler);

  // ─── Global Error Handler ─────────────────────────────────────────────────
  app.use(errorHandler);

  return app;
};

export default createApp;
