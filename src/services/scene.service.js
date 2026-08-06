import sceneRepository from '../repositories/scene.repository.js';
import { NotFoundError } from '../utilities/custom-errors.js';

/**
 * Return all scenes for a document, ordered by sceneNumber.
 *
 * @param {string} documentId
 * @returns {Promise<import('mongoose').Document[]>}
 */
const getScenesForDocument = async (documentId) => {
  return sceneRepository.findScenesByDocumentIdOrdered(documentId);
};

/**
 * Return a single scene by its ID.
 *
 * @param {string} sceneId
 * @returns {Promise<import('mongoose').Document>}
 */
const getSceneById = async (sceneId) => {
  const scene = await sceneRepository.findById(sceneId);
  if (!scene) throw new NotFoundError('Scene not found.');
  return scene;
};

export { getScenesForDocument, getSceneById };
