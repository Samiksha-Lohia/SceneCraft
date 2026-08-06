import moodAnalysisRepository from '../repositories/mood-analysis.repository.js';

/**
 * Return all mood analysis records for a document.
 *
 * @param {string} documentId
 */
const getMoodAnalysisForDocument = async (documentId) => {
  return moodAnalysisRepository.findByDocumentId(documentId);
};

export { getMoodAnalysisForDocument };
