import timelineEventRepository from '../repositories/timeline-event.repository.js';

/**
 * Return all timeline events for a document sorted chronologically.
 *
 * @param {string} documentId
 */
const getTimelineForDocument = async (documentId) => {
  return timelineEventRepository.findByDocumentIdChronological(documentId);
};

export { getTimelineForDocument };
