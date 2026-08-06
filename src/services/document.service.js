import path from 'path';
import documentRepository from '../repositories/document.repository.js';
import processingJobRepository from '../repositories/processing-job.repository.js';
import sceneRepository from '../repositories/scene.repository.js';
import characterRepository from '../repositories/character.repository.js';
import relationshipRepository from '../repositories/relationship.repository.js';
import timelineEventRepository from '../repositories/timeline-event.repository.js';
import dialogueSummaryRepository from '../repositories/dialogue-summary.repository.js';
import moodAnalysisRepository from '../repositories/mood-analysis.repository.js';
import storyArcRepository from '../repositories/story-arc.repository.js';
import continuityIssueRepository from '../repositories/continuity-issue.repository.js';
import embeddingRepository from '../repositories/embedding.repository.js';
import { uploadFile, deleteFile } from './storage.service.js';
import { pipelineQueue } from '../queues/pipeline.queue.js';
import { DocumentDto } from '../dtos/document.dto.js';
import { NotFoundError } from '../utilities/custom-errors.js';
import STAGES, { STAGE_LIST } from '../constants/stages.js';
import logger from '../utilities/logger.js';

/**
 * Pipeline dependency map: each stage lists which stages must complete before it.
 */
const STAGE_DEPENDENCIES = {
  [STAGES.PARSING]:       [],
  [STAGES.SCENES]:        [STAGES.PARSING],
  [STAGES.CHARACTERS]:    [STAGES.SCENES],
  [STAGES.RELATIONSHIPS]: [STAGES.CHARACTERS],
  [STAGES.TIMELINE]:      [STAGES.SCENES],
  [STAGES.DIALOGUE]:      [STAGES.SCENES],
  [STAGES.MOOD]:          [STAGES.SCENES],
  [STAGES.ARC]:           [STAGES.CHARACTERS, STAGES.MOOD],
  [STAGES.CONTINUITY]:    [STAGES.RELATIONSHIPS, STAGES.TIMELINE],
  [STAGES.EMBEDDINGS]:    [STAGES.ARC, STAGES.DIALOGUE],
};

// ─────────────────────────────────────────────────────────────────────────────

/**
 * Upload a new document, store the file, seed job records, and kick off parsing.
 *
 * @param {string} userId   - Authenticated user's ID
 * @param {Object} file     - Multer file object (req.file)
 * @returns {Promise<DocumentDto>}
 */
const uploadDocument = async (userId, file) => {
  const ext = path.extname(file.originalname).toLowerCase().slice(1); // 'pdf' | 'docx' | 'txt'
  const storageKey = `documents/${userId}/${Date.now()}-${file.originalname}`;

  // 1. Persist the file to storage
  const storageUrl = await uploadFile(file, storageKey);

  // 2. Create the document record
  const document = await documentRepository.create({
    userId,
    title: path.basename(file.originalname, path.extname(file.originalname)),
    originalFilename: file.originalname,
    fileType: ext,
    storageUrl,
    status: 'processing',
  });

  // 3. Seed a ProcessingJob record for every stage
  const jobRecords = STAGE_LIST.map((stage) => ({
    documentId: document._id,
    stage,
    status: 'queued',
    dependsOn: STAGE_DEPENDENCIES[stage],
  }));
  await processingJobRepository.create(jobRecords);

  // 4. Dispatch the first job (parsing) to BullMQ
  await pipelineQueue.add(
    STAGES.PARSING,
    { documentId: document._id.toString(), stage: STAGES.PARSING, storageUrl, fileType: ext },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 }, jobId: `${document._id}:${STAGES.PARSING}` }
  );

  logger.info(`Document ${document._id} uploaded — pipeline started.`);
  return DocumentDto.toResponse(document);
};

/**
 * List all documents belonging to a user.
 *
 * @param {string} userId
 * @returns {Promise<DocumentDto[]>}
 */
const getUserDocuments = async (userId) => {
  const docs = await documentRepository.findByUserId(userId);
  return DocumentDto.toResponseList(docs);
};

/**
 * Get a single document by ID.
 *
 * @param {string} documentId
 * @returns {Promise<DocumentDto>}
 */
const getDocumentById = async (documentId) => {
  const doc = await documentRepository.findById(documentId);
  if (!doc) throw new NotFoundError('Document not found.');
  return DocumentDto.toResponse(doc);
};

/**
 * Delete a document and cascade-delete all related analysis data.
 *
 * @param {string} documentId
 */
const deleteDocument = async (documentId) => {
  const doc = await documentRepository.findById(documentId);
  if (!doc) throw new NotFoundError('Document not found.');

  // Cascade deletions in parallel
  await Promise.all([
    sceneRepository.deleteMany({ documentId }),
    characterRepository.deleteMany({ documentId }),
    relationshipRepository.deleteMany({ documentId }),
    timelineEventRepository.deleteMany({ documentId }),
    dialogueSummaryRepository.deleteMany({ documentId }),
    moodAnalysisRepository.deleteMany({ documentId }),
    storyArcRepository.deleteMany({ documentId }),
    continuityIssueRepository.deleteMany({ documentId }),
    embeddingRepository.deleteMany({ documentId }),
    processingJobRepository.deleteMany({ documentId }),
  ]);

  // Delete the stored file (best-effort)
  const storageKey = doc.storageUrl.includes('amazonaws.com')
    ? doc.storageUrl.split('.amazonaws.com/')[1]
    : doc.storageUrl;
  await deleteFile(doc.storageUrl, storageKey).catch((err) =>
    logger.warn(`File deletion warning for document ${documentId}: ${err.message}`)
  );

  await documentRepository.deleteById(documentId);
  logger.info(`Document ${documentId} and all related records deleted.`);
};

export { uploadDocument, getUserDocuments, getDocumentById, deleteDocument };
