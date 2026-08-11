import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireDocumentOwnership } from '../middleware/ownership.middleware.js';
import { uploadSingle } from '../middleware/upload.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { documentIdParamSchema, updateDocumentBodySchema } from '../validators/document.validator.js';
import * as documentService from '../services/document.service.js';
import { sendSuccess, sendCreated, sendPaginated } from '../utilities/response.js';
import { DocumentDto } from '../dtos/document.dto.js';

const router = Router();

// All document routes require authentication
router.use(authenticate);

/**
 * GET /api/documents
 * Returns all documents belonging to the authenticated user.
 */
router.get('/', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;

    const { results, pagination } = await documentService.getUserDocuments(req.user.id, page, limit);
    if (pagination) {
      sendPaginated(res, results, pagination, 'Documents retrieved.');
    } else {
      sendSuccess(res, results, 200, 'Documents retrieved.');
    }
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/documents
 * Uploads a new story document. Expects multipart/form-data with field "file".
 */
router.post('/',
   uploadSingle, async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'No file uploaded.' });
    }
    const doc = await documentService.uploadDocument(req.user.id, req.file);
    // documentService.uploadDocument already returns a DocumentDto response
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
      sendSuccess(res, DocumentDto.toResponse(req.document), 200, 'Document retrieved.');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /api/documents/:documentId/download
 * Secure download endpoint returning local files or redirecting to remote URLs.
 */
router.get(
  '/:documentId/download',
  validate(documentIdParamSchema),
  requireDocumentOwnership,
  async (req, res, next) => {
    try {
      const doc = req.document;
      if (doc.storageUrl.startsWith('http')) {
        return res.redirect(doc.storageUrl);
      }
      res.sendFile(doc.storageUrl);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * PATCH /api/documents/:documentId
 * Updates the document's title.
 */
router.patch(
  '/:documentId',
  validate(documentIdParamSchema),
  requireDocumentOwnership,
  validate(updateDocumentBodySchema),
  async (req, res, next) => {
    try {
      const doc = await documentService.updateDocumentTitle(
        req.params.documentId,
        req.user.id,
        req.body.title,
      );
      sendSuccess(res, doc, 200, 'Document title updated.');
    } catch (err) {
      next(err);
    }
  },
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
