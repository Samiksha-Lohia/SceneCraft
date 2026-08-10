import mongoose from 'mongoose';
import connectDB from '../src/config/db.js';
import { redis } from '../src/config/redis.js';

export const setupTestDB = (before, after, afterEach) => {
  before(async () => {
    // Set environment to test
    process.env.NODE_ENV = 'test';
    // Use test DB to prevent polluting dev DB
    if (!process.env.MONGO_URI) {
      process.env.MONGO_URI = 'mongodb://localhost:27017/scenecraft_test';
    }
    // If not already connected, connect to the DB
    if (mongoose.connection.readyState === 0) {
      await connectDB();
    }
  });

  after(async () => {
    await mongoose.connection.close();
    await redis.quit();
  });

  afterEach(async () => {
    // Reset all database collections
    if (mongoose.connection.readyState !== 0) {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].deleteMany({});
      }
    }
    // Clear all Redis keys to reset rate limiters and refresh tokens
    await redis.flushdb();
  });
};
