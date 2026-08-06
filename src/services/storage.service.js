import fs from 'fs/promises';
import path from 'path';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import config from '../config/env.js';
import logger from '../utilities/logger.js';

// ─── S3 Client (only used if STORAGE_PROVIDER=s3) ─────────────────────────────
let s3Client = null;
if (config.storage.provider === 's3') {
  s3Client = new S3Client({
    region: config.storage.s3.region,
    credentials: {
      accessKeyId: config.storage.s3.accessKeyId,
      secretAccessKey: config.storage.s3.secretAccessKey,
    },
  });
}

/**
 * Upload a file buffer or disk-written file and return a stable storage URL.
 *
 * @param {Object} file       - Multer file object (req.file)
 * @param {string} storageKey - Destination key / relative path
 * @returns {Promise<string>} URL pointing to the stored file
 */
const uploadFile = async (file, storageKey) => {
  if (config.storage.provider === 's3') {
    const command = new PutObjectCommand({
      Bucket: config.storage.s3.bucketName,
      Key: storageKey,
      Body: file.buffer,
      ContentType: file.mimetype,
    });
    await s3Client.send(command);
    // Return the standard S3 object URL
    return `https://${config.storage.s3.bucketName}.s3.${config.storage.s3.region}.amazonaws.com/${storageKey}`;
  }

  // ─── Local storage ────────────────────────────────────────────────────────
  // Multer diskStorage already wrote the file; resolve its path as the URL.
  // If memoryStorage were used locally (shouldn't be), we write it ourselves.
  if (file.path) {
    return path.resolve(file.path);
  }

  const destPath = path.join(config.file.uploadDir, storageKey);
  await fs.mkdir(path.dirname(destPath), { recursive: true });
  await fs.writeFile(destPath, file.buffer);
  return destPath;
};

/**
 * Delete a file from storage by its storage URL.
 *
 * @param {string} storageUrl - The URL returned by uploadFile()
 * @param {string} storageKey - The S3 key (only needed for S3 provider)
 */
const deleteFile = async (storageUrl, storageKey) => {
  if (config.storage.provider === 's3' && s3Client) {
    const command = new DeleteObjectCommand({
      Bucket: config.storage.s3.bucketName,
      Key: storageKey,
    });
    await s3Client.send(command);
    logger.debug(`Deleted S3 object: ${storageKey}`);
    return;
  }

  // Local: delete from filesystem
  try {
    await fs.unlink(storageUrl);
    logger.debug(`Deleted local file: ${storageUrl}`);
  } catch (err) {
    logger.warn(`Could not delete local file at ${storageUrl}: ${err.message}`);
  }
};

export { uploadFile, deleteFile };
