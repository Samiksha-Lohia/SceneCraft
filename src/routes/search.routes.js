import { Router } from 'express';

import { authenticate } from '../middleware/auth.middleware.js';
import { requireDocumentOwnership } from '../middleware/ownership.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { documentIdParamSchema, searchQuerySchema } from '../validators/document.validator.js';
import * as searchService from '../services/search.service.js';
import { sendSuccess } from '../utilities/response.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', validate(documentIdParamSchema), validate(searchQuerySchema), requireDocumentOwnership, async (req, res, next) => {
  try {
    const { q, character, sceneRange, sceneRangeFrom, sceneRangeTo, mood } = req.query;
    
    // Package filters
    const filters = {
      character,
      sceneRange,
      sceneRangeFrom,
      sceneRangeTo,
      mood,
    };

    const results = await searchService.semanticSearch(req.params.documentId, q, filters);
    sendSuccess(res, results, 200, 'Semantic search completed.');
  } catch (err) {
    next(err);
  }
});

export default router;
