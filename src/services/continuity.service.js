import continuityIssueRepository from '../repositories/continuity-issue.repository.js';
import { NotFoundError } from '../utilities/custom-errors.js';

/**
 * Return all continuity issues for a document, sorted by severity then date.
 *
 * @param {string} documentId
 */
const getContinuityIssuesForDocument = async (documentId) => {
  return continuityIssueRepository.findByDocumentId(documentId);
};

/**
 * Update the status of a single continuity issue.
 *
 * The issue is looked up by both _id and documentId so that users can only
 * mutate issues belonging to a document they already own (ownership is
 * enforced upstream by requireDocumentOwnership middleware).
 *
 * @param {string} issueId    - ContinuityIssue _id
 * @param {string} documentId - Parent document _id (scoping guard)
 * @param {string} status     - New status value
 * @returns {Promise<object>} Updated continuity issue document
 */
const updateIssueStatus = async (issueId, documentId, status) => {
  const issue = await continuityIssueRepository.findOne({ _id: issueId, documentId });

  if (!issue) {
    throw new NotFoundError('Continuity issue not found.');
  }

  const updated = await continuityIssueRepository.updateById(issueId, { status });
  return updated;
};

export { getContinuityIssuesForDocument, updateIssueStatus };
