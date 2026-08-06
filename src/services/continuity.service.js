import continuityIssueRepository from '../repositories/continuity-issue.repository.js';

const getContinuityIssuesForDocument = async (documentId) => {
  return continuityIssueRepository.findByDocumentId(documentId);
};

export { getContinuityIssuesForDocument };
