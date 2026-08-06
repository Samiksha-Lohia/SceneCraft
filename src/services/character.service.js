import characterRepository from '../repositories/character.repository.js';
import { NotFoundError } from '../utilities/custom-errors.js';

/**
 * Return all characters for a document, sorted alphabetically by name.
 *
 * @param {string} documentId
 */
const getCharactersForDocument = async (documentId) => {
  return characterRepository.findByDocumentId(documentId);
};

/**
 * Return a single character by its ID.
 *
 * @param {string} characterId
 */
const getCharacterById = async (characterId) => {
  const character = await characterRepository.findById(characterId);
  if (!character) throw new NotFoundError('Character not found.');
  return character;
};

/**
 * Perform a text-index search against character names and aliases.
 *
 * @param {string} documentId
 * @param {string} query
 */
const searchCharacters = async (documentId, query) => {
  return characterRepository.searchCharacters(documentId, query);
};

export { getCharactersForDocument, getCharacterById, searchCharacters };
