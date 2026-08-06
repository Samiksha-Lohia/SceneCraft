import Redis from 'ioredis';
import config from './env.js';

let redisClient = null;

const getRedisClient = () => {
  if (!redisClient) {
    redisClient = new Redis(config.redis.url, {
      maxRetriesPerRequest: null, // Required by BullMQ
      reconnectOnError: (err) => {
        const targetError = 'READONLY';
        if (err.message.slice(0, targetError.length) === targetError) {
          return true; // Reconnect on read-only errors
        }
        return false;
      },
      retryStrategy: (times) => {
        // Exponential backoff strategy up to 20 seconds maximum
        const delay = Math.min(times * 100, 20000);
        return delay;
      }
    });

    redisClient.on('connect', () => {
      console.log('Redis client attempting connection...');
    });

    redisClient.on('ready', () => {
      console.log('Redis client connected and ready.');
    });

    redisClient.on('error', (err) => {
      console.error(`Redis connection error: ${err.message}`);
    });

    redisClient.on('close', () => {
      console.warn('Redis connection closed.');
    });

    redisClient.on('reconnecting', (delay) => {
      console.log(`Redis reconnecting in ${delay}ms...`);
    });
  }
  return redisClient;
};

const redisInstance = getRedisClient();

export {
  getRedisClient,
  redisInstance as redis
};
