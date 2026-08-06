import dotenv from 'dotenv';
import Joi from 'joi';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: path.join(__dirname, '../../.env') });

// Define validation schema for environment variables
const envVarsSchema = Joi.object()
  .keys({
    NODE_ENV: Joi.string().valid('development', 'production', 'test').default('development'),
    PORT: Joi.number().default(5000),
    MONGO_URI: Joi.string().required().description('MongoDB connection URI'),
    REDIS_URL: Joi.string().required().description('Redis URL'),
    JWT_ACCESS_SECRET: Joi.string().required().description('JWT Access Token secret key'),
    JWT_REFRESH_SECRET: Joi.string().required().description('JWT Refresh Token secret key'),
    JWT_ACCESS_EXPIRY: Joi.string().default('15m').description('JWT Access Token expiration time'),
    JWT_REFRESH_EXPIRY: Joi.string().default('7d').description('JWT Refresh Token expiration time'),
    MAX_FILE_SIZE_MB: Joi.number().default(10).description('Max uploaded file size in Megabytes'),
    UPLOAD_DIR: Joi.string().default('uploads/').description('Upload directory path'),
    ALLOWED_MIME_TYPES: Joi.string()
      .default('application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain')
      .description('Comma-separated allowed MIME types for uploads'),
    STORAGE_PROVIDER: Joi.string().valid('local', 's3').default('local'),
    AWS_ACCESS_KEY_ID: Joi.string().when('STORAGE_PROVIDER', {
      is: 's3',
      then: Joi.required(),
      otherwise: Joi.optional().allow(''),
    }),
    AWS_SECRET_ACCESS_KEY: Joi.string().when('STORAGE_PROVIDER', {
      is: 's3',
      then: Joi.required(),
      otherwise: Joi.optional().allow(''),
    }),
    AWS_REGION: Joi.string().default('us-east-1'),
    AWS_S3_BUCKET_NAME: Joi.string().when('STORAGE_PROVIDER', {
      is: 's3',
      then: Joi.required(),
      otherwise: Joi.optional().allow(''),
    }),
    AI_PROVIDER: Joi.string().valid('gemini', 'openai').default('gemini'),
    GEMINI_API_KEY: Joi.string().when('AI_PROVIDER', {
      is: 'gemini',
      then: Joi.required(),
      otherwise: Joi.optional().allow(''),
    }),
    OPENAI_API_KEY: Joi.string().when('AI_PROVIDER', {
      is: 'openai',
      then: Joi.required(),
      otherwise: Joi.optional().allow(''),
    }),
    EMBEDDING_MODEL: Joi.string().default('text-embedding-004'),
  })
  .unknown();

const { value: envVars, error } = envVarsSchema.prefs({ errors: { label: 'key' } }).validate(process.env);

if (error) {
  throw new Error(`Environment validation error: ${error.message}`);
}

const config = {
  env: envVars.NODE_ENV,
  port: envVars.PORT,
  mongoose: {
    url: envVars.MONGO_URI,
  },
  redis: {
    url: envVars.REDIS_URL,
  },
  jwt: {
    accessSecret: envVars.JWT_ACCESS_SECRET,
    refreshSecret: envVars.JWT_REFRESH_SECRET,
    accessExpiry: envVars.JWT_ACCESS_EXPIRY,
    refreshExpiry: envVars.JWT_REFRESH_EXPIRY,
  },
  file: {
    maxSizeBytes: envVars.MAX_FILE_SIZE_MB * 1024 * 1024,
    uploadDir: path.resolve(envVars.UPLOAD_DIR),
    allowedTypes: envVars.ALLOWED_MIME_TYPES.split(','),
  },
  storage: {
    provider: envVars.STORAGE_PROVIDER,
    s3: {
      accessKeyId: envVars.AWS_ACCESS_KEY_ID,
      secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
      region: envVars.AWS_REGION,
      bucketName: envVars.AWS_S3_BUCKET_NAME,
    },
  },
  ai: {
    provider: envVars.AI_PROVIDER,
    gemini: {
      apiKey: envVars.GEMINI_API_KEY,
    },
    openai: {
      apiKey: envVars.OPENAI_API_KEY,
    },
    embeddingModel: envVars.EMBEDDING_MODEL,
  },
};

export default config;
