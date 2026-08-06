import { Router } from 'express';

import { authenticate } from '../middleware/auth.middleware.js';
import { requireDocumentOwnership } from '../middleware/ownership.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { characterIdParamSchema, documentIdParamSchema, searchQuerySchema } from '../validators/document.validator.js';
import * as characterService from '../services/character.service.js';
import { sendSuccess } from '../utilities/response.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/', validate(documentIdParamSchema), requireDocumentOwnership, async (req, res, next) => {
  try {
    const characters = await characterService.getCharactersForDocument(req.params.documentId);
    sendSuccess(res, characters, 200, 'Characters retrieved.');
  } catch (err) {
    next(err);
  }
});

router.get('/search', validate(searchQuerySchema), requireDocumentOwnership, async (req, res, next) => {
  try {
    const characters = await characterService.searchCharacters(req.params.documentId, req.query.q);
    sendSuccess(res, characters, 200, 'Character search completed.');
  } catch (err) {
    next(err);
  }
});

router.get('/:characterId', validate(characterIdParamSchema), requireDocumentOwnership, async (req, res, next) => {
  try {
    const character = await characterService.getCharacterById(req.params.characterId);
    sendSuccess(res, character, 200, 'Character retrieved.');
  } catch (err) {
    next(err);
  }
});

export default router;
