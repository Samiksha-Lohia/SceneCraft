import dialogueSummaryRepository from '../repositories/dialogue-summary.repository.js';

/**
 * Return all dialogue summaries for a specific scene.
 *
 * @param {string} sceneId
 */
const getDialogueForScene = async (sceneId) => {
  return dialogueSummaryRepository.findBySceneId(sceneId);
};

const getDialogueForDocument = async (documentId) => {
  return dialogueSummaryRepository.find({ documentId });
};

/**
 * Return all dialogue summaries for a specific character across all scenes in a document.
 *
 * @param {string} documentId
 * @param {string} characterId
 */
const getDialogueForCharacter = async (documentId, characterId) => {
  return dialogueSummaryRepository.findByCharacterId(documentId, characterId);
};

export { getDialogueForDocument, getDialogueForScene, getDialogueForCharacter };
