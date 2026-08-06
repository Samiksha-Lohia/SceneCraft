import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireDocumentOwnership } from '../middleware/ownership.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { documentIdParamSchema } from '../validators/document.validator.js';
import * as documentService from '../services/document.service.js';
import { sendSuccess, sendCreated } from '../utilities/response.js';

const router = Router();

// All document routes require authentication
router.use(authenticate);

/**
 * GET /api/documents
 * Returns all documents belonging to the authenticated user.
 */
router.get('/', async (req, res, next) => {
  try {
    const docs = await documentService.getUserDocuments(req.user.id);
    sendSuccess(res, docs, 200, 'Documents retrieved.');
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/documents
 * Uploads a new story document. Expects multipart/form-data with field "file".
 */
router.post('/', uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const doc = await documentService.uploadDocument(req.user.id, req.file);
    sendCreated(res, doc, 'Document uploaded and processing started.');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/documents/:documentId
 * Returns metadata for a single document.
 */
router.get(
  '/:documentId',
  validate(documentIdParamSchema),
  requireDocumentOwnership,
  async (req, res, next) => {
    try {
      sendSuccess(res, req.document, 200, 'Document retrieved.');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * DELETE /api/documents/:documentId
 * Deletes a document and all associated analysis data.
 */
router.delete(
  '/:documentId',
  validate(documentIdParamSchema),
  requireDocumentOwnership,
  async (req, res, next) => {
    try {
      await documentService.deleteDocument(req.params.documentId);
      sendSuccess(res, null, 200, 'Document deleted successfully.');
    } catch (err) {
      next(err);
    }
  }
);

export default router;
