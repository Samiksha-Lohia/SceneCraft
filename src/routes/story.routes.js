import { Router } from 'express';

import { authenticate } from '../middleware/auth.middleware.js';
import { requireDocumentOwnership } from '../middleware/ownership.middleware.js';
import { validate } from '../middleware/validate.middleware.js';
import { documentIdParamSchema } from '../validators/document.validator.js';
import * as relationshipService from '../services/relationship.service.js';
import * as timelineService from '../services/timeline.service.js';
import * as dialogueService from '../services/dialogue.service.js';
import * as moodService from '../services/mood.service.js';
import * as storyArcService from '../services/storyArc.service.js';
import * as continuityService from '../services/continuity.service.js';
import { sendSuccess } from '../utilities/response.js';

const router = Router({ mergeParams: true });

router.use(authenticate);
router.use(validate(documentIdParamSchema), requireDocumentOwnership);

router.get('/relationships', async (req, res, next) => {
  try {
    const relationships = await relationshipService.getRelationshipsForDocument(req.params.documentId);
    sendSuccess(res, relationships, 200, 'Relationships retrieved.');
  } catch (err) {
    next(err);
  }
});

router.get('/timeline', async (req, res, next) => {
  try {
    const timeline = await timelineService.getTimelineForDocument(req.params.documentId);
    sendSuccess(res, timeline, 200, 'Timeline retrieved.');
  } catch (err) {
    next(err);
  }
});

router.get('/dialogue', async (req, res, next) => {
  try {
    const dialogue = req.query.characterId
      ? await dialogueService.getDialogueForCharacter(req.params.documentId, req.query.characterId)
      : await dialogueService.getDialogueForDocument(req.params.documentId);
    sendSuccess(res, dialogue, 200, 'Dialogue summaries retrieved.');
  } catch (err) {
    next(err);
  }
});

router.get('/mood', async (req, res, next) => {
  try {
    const mood = await moodService.getMoodAnalysisForDocument(req.params.documentId);
    sendSuccess(res, mood, 200, 'Mood analysis retrieved.');
  } catch (err) {
    next(err);
  }
});

router.get('/arc', async (req, res, next) => {
  try {
    const arc = await storyArcService.getStoryArcForDocument(req.params.documentId);
    sendSuccess(res, arc, 200, 'Story arc retrieved.');
  } catch (err) {
    next(err);
  }
});

router.get('/continuity', async (req, res, next) => {
  try {
    const issues = await continuityService.getContinuityIssuesForDocument(req.params.documentId);
    sendSuccess(res, issues, 200, 'Continuity issues retrieved.');
  } catch (err) {
    next(err);
  }
});

export default router;
