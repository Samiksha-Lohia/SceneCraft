import { Router } from 'express';

import authRoutes from './auth.routes.js';
import documentRoutes from './document.routes.js';
import sceneRoutes from './scene.routes.js';
import analysisRoutes from './analysis.routes.js';
import characterRoutes from './character.routes.js';
import storyRoutes from './story.routes.js';
import searchRoutes from './search.routes.js';

const router = Router();

router.use('/auth', authRoutes);
router.use('/documents', documentRoutes);
router.use('/documents/:documentId/scenes', sceneRoutes);
router.use('/documents/:documentId/jobs', analysisRoutes);
router.use('/documents/:documentId/characters', characterRoutes);
router.use('/documents/:documentId/story', storyRoutes);
router.use('/documents/:documentId/search', searchRoutes);

export default router;
