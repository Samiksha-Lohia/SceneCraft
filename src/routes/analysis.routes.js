import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireDocumentOwnership } from '../middleware/ownership.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { documentIdParamSchema, stageParamSchema } from '../validators/document.validator.js';
import * as analysisService from '../services/analysis.service.js';
import { sendSuccess } from '../utilities/response.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

/**
 * GET /api/documents/:documentId/jobs
 * Returns all 10 processing job records (pipeline progress).
 */
router.get(
  '/',
  validate(documentIdParamSchema),
  requireDocumentOwnership,
  async (req, res, next) => {
    try {
      const jobs = await analysisService.getJobsForDocument(req.params.documentId);
      sendSuccess(res, jobs, 200, 'Pipeline jobs retrieved.');
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /api/documents/:documentId/jobs/:stage/retry
 * Re-queues a failed pipeline stage.
 */
router.post(
  '/:stage/retry',
  validate(stageParamSchema),
  requireDocumentOwnership,
  async (req, res, next) => {
    try {
      const job = await analysisService.retryStage(req.params.documentId, req.params.stage);
      sendSuccess(res, job, 200, `Stage '${req.params.stage}' re-queued successfully.`);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
