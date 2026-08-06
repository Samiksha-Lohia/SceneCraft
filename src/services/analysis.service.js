import processingJobRepository from '../repositories/processing-job.repository.js';
import { pipelineQueue } from '../queues/pipeline.queue.js';
import { AnalysisDto } from '../dtos/analysis.dto.js';
import { NotFoundError, BadRequestError } from '../utilities/custom-errors.js';
import { JOB_STATUSES } from '../constants/job-status.js';
import logger from '../utilities/logger.js';

/**
 * Return all processing job records for a document (pipeline progress).
 *
 * @param {string} documentId
 * @returns {Promise<AnalysisDto[]>}
 */
const getJobsForDocument = async (documentId) => {
  const jobs = await processingJobRepository.findByDocumentId(documentId);
  return AnalysisDto.toResponseList(jobs);
};

/**
 * Re-queue a failed stage job in BullMQ so it can be retried.
 *
 * @param {string} documentId
 * @param {string} stage
 * @returns {Promise<AnalysisDto>}
 */
const retryStage = async (documentId, stage) => {
  const job = await processingJobRepository.findStageJob(documentId, stage);
  if (!job) {
    throw new NotFoundError(`No job record found for stage '${stage}' on document '${documentId}'.`);
  }

  if (job.status !== JOB_STATUSES.FAILED) {
    throw new BadRequestError(`Stage '${stage}' cannot be retried — current status is '${job.status}'.`);
  }

  // Reset the DB record
  const updated = await processingJobRepository.updateOne(
    { documentId, stage },
    { status: JOB_STATUSES.QUEUED, progress: 0, error: null, startedAt: null, completedAt: null }
  );

  // Re-dispatch to BullMQ
  await pipelineQueue.add(
    stage,
    { documentId, stage },
    { attempts: 3, backoff: { type: 'exponential', delay: 5000 } }
  );

  logger.info(`Stage '${stage}' for document ${documentId} re-queued.`);
  return AnalysisDto.toResponse(updated);
};

export { getJobsForDocument, retryStage };
