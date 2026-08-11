import sceneRepository from '../repositories/scene.repository.js';
import { NotFoundError } from '../utilities/custom-errors.js';
import { SceneDto } from '../dtos/scene.dto.js';

/**
 * Return all scenes for a document, ordered by sceneNumber, with optional pagination.
 *
 * @param {string} documentId
 * @param {number} [page]
 * @param {number} [limit]
 * @returns {Promise<{ results: SceneDto[], pagination?: object }>}
 */
const getScenesForDocument = async (documentId, page, limit) => {
  if (page !== undefined && limit !== undefined) {
    const skip = (page - 1) * limit;
    const total = await sceneRepository.count({ documentId });
    const scenes = await sceneRepository.find(
      { documentId },
      null,
      { sort: { sceneNumber: 1 }, skip, limit }
    );
    return {
      results: SceneDto.toResponseList(scenes),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const scenes = await sceneRepository.findScenesByDocumentIdOrdered(documentId);
  return { results: SceneDto.toResponseList(scenes) };
};

/**
 * Return a single scene by its ID.
 *
 * @param {string} sceneId
 * @returns {Promise<SceneDto>}
 */
const getSceneById = async (sceneId) => {
  const scene = await sceneRepository.findById(sceneId);
  if (!scene) throw new NotFoundError('Scene not found.');
  return SceneDto.toResponse(scene);
};

export { getScenesForDocument, getSceneById };
