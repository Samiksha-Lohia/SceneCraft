import multer from 'multer';
import path from 'path';
import fs from 'fs';
import config from '../config/env.js';
import { BadRequestError } from '../utilities/custom-errors.js';

/**
 * Multer storage strategy:
 *  - local: writes to UPLOAD_DIR on disk
 *  - s3:    uses memoryStorage so the buffer can be streamed to S3
 */
const buildStorage = () => {
  if (config.storage.provider === 's3') {
    return multer.memoryStorage();
  }

  // Ensure local upload directory exists
  if (!fs.existsSync(config.file.uploadDir)) {
    fs.mkdirSync(config.file.uploadDir, { recursive: true });
  }

  return multer.diskStorage({
    destination: (_req, _file, cb) => {
      cb(null, config.file.uploadDir);
    },
    filename: (_req, file, cb) => {
      const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      const ext = path.extname(file.originalname);
      cb(null, `${uniqueSuffix}${ext}`);
    },
  });
};

/**
 * Multer file filter — only accepts configured MIME types.
 */
const fileFilter = (_req, file, cb) => {
  if (config.file.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new BadRequestError(
        `Unsupported file type: ${file.mimetype}. Allowed types: ${config.file.allowedTypes.join(', ')}`
      ),
      false
    );
  }
};

const upload = multer({
  storage: buildStorage(),
  limits: { fileSize: config.file.maxSizeBytes },
  fileFilter,
});

/**
 * Single-file upload middleware for field name "file".
 * Usage: router.post('/documents', uploadSingle, handler)
 */
const uploadSingle = upload.single('file');

export { upload, uploadSingle };
