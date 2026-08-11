import characterRepository from '../repositories/character.repository.js';
import { NotFoundError } from '../utilities/custom-errors.js';
import { CharacterDto } from '../dtos/character.dto.js';

/**
 * Return all characters for a document, sorted alphabetically by name, with optional pagination.
 *
 * @param {string} documentId
 * @param {number} [page]
 * @param {number} [limit]
 * @returns {Promise<{ results: CharacterDto[], pagination?: object }>}
 */
const getCharactersForDocument = async (documentId, page, limit) => {
  if (page !== undefined && limit !== undefined) {
    const skip = (page - 1) * limit;
    const total = await characterRepository.count({ documentId });
    const characters = await characterRepository.find(
      { documentId },
      null,
      { sort: { name: 1 }, skip, limit }
    );
    return {
      results: CharacterDto.toResponseList(characters),
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  const characters = await characterRepository.findByDocumentId(documentId);
  return { results: CharacterDto.toResponseList(characters) };
};

/**
 * Return a single character by its ID.
 *
 * @param {string} characterId
 * @returns {Promise<CharacterDto>}
 */
const getCharacterById = async (characterId) => {
  const character = await characterRepository.findById(characterId);
  if (!character) throw new NotFoundError('Character not found.');
  return CharacterDto.toResponse(character);
};

/**
 * Perform a text-index search against character names and aliases.
 *
 * @param {string} documentId
 * @param {string} query
 * @returns {Promise<CharacterDto[]>}
 */
const searchCharacters = async (documentId, query) => {
  const characters = await characterRepository.searchCharacters(documentId, query);
  return CharacterDto.toResponseList(characters);
};

export { getCharactersForDocument, getCharacterById, searchCharacters };
