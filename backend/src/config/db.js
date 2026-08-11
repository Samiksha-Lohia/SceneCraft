import mongoose from 'mongoose';
import config from './env.js';
import logger from '../utilities/logger.js';

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoose.url, {
      autoIndex: true, // Build indexes automatically in MongoDB
    });

    logger.info(`MongoDB Connected: ${conn.connection.host}`);
    
    // Additional listeners for ongoing connection management
    mongoose.connection.on('error', (err) => {
      logger.error(`MongoDB connection error: ${err}`);
    });

    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB disconnected. Attempting to reconnect...');
    });
  } catch (error) {
    logger.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
