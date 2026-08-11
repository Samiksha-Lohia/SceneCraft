import storyArcRepository from '../repositories/story-arc.repository.js';
import { NotFoundError } from '../utilities/custom-errors.js';

/**
 * Return the story arc record for a document.
 *
 * @param {string} documentId
 */
const getStoryArcForDocument = async (documentId) => {
  const arc = await storyArcRepository.findByDocumentId(documentId);
  if (!arc) throw new NotFoundError('Story arc has not been generated yet for this document.');
  return arc;
};

export { getStoryArcForDocument };
