import documentRepository from '../repositories/document.repository.js';
import { ForbiddenError, NotFoundError } from '../utilities/custom-errors.js';

/**
 * Ownership guard middleware.
 *
 * - Loads the document referenced by req.params.documentId
 * - Confirms the authenticated user owns it
 * - Attaches req.document so downstream handlers don't have to re-fetch
 *
 * Must be used AFTER the authenticate middleware.
 */
const requireDocumentOwnership = async (req, _res, next) => {
  try {
    const { documentId } = req.params;
    const document = await documentRepository.findById(documentId);

    if (!document) {
      return next(new NotFoundError('Document not found.'));
    }

    if (document.userId.toString() !== req.user.id.toString()) {
      return next(new ForbiddenError('You do not have access to this document.'));
    }

    req.document = document;
    next();
  } catch (err) {
    next(err);
  }
};

export { requireDocumentOwnership };
