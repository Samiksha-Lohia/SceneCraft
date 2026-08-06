import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware.js';
import { requireDocumentOwnership } from '../middleware/ownership.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { documentIdParamSchema, sceneIdParamSchema } from '../validators/document.validator.js';
import * as sceneService from '../services/scene.service.js';
import { sendSuccess } from '../utilities/response.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

/**
 * GET /api/documents/:documentId/scenes
 */
router.get('/', validate(documentIdParamSchema), requireDocumentOwnership, async (req, res, next) => {
  try {
    const scenes = await sceneService.getScenesForDocument(req.params.documentId);
    sendSuccess(res, scenes, 200, 'Scenes retrieved.');
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/documents/:documentId/scenes/:sceneId
 */
router.get('/:sceneId', validate(sceneIdParamSchema), requireDocumentOwnership, async (req, res, next) => {
  try {
    const scene = await sceneService.getSceneById(req.params.sceneId);
    sendSuccess(res, scene, 200, 'Scene retrieved.');
  } catch (err) {
    next(err);
  }
});

export default router;
