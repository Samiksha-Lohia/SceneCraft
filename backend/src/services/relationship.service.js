import relationshipRepository from '../repositories/relationship.repository.js';

/**
 * Return all relationship edges for a document.
 *
 * @param {string} documentId
 */
const getRelationshipsForDocument = async (documentId) => {
  return relationshipRepository.findByDocumentId(documentId);
};

export { getRelationshipsForDocument };
