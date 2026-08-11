export class CharacterDto {
  constructor(character) {
    this.id = character._id || character.id;
    this.documentId = character.documentId;
    this.name = character.name;
    this.aliases = character.aliases || [];
    this.role = character.role || 'supporting';
    this.traits = character.traits || [];
    this.description = character.description || '';
    this.arcSummary = character.arcSummary || '';
    this.sceneIds = character.sceneIds || [];
    this.createdAt = character.createdAt;
    this.updatedAt = character.updatedAt;
  }

  static toResponse(character) {
    if (!character) return null;
    return new CharacterDto(character);
  }

  static toResponseList(characters) {
    if (!Array.isArray(characters)) return [];
    return characters.map(char => new CharacterDto(char));
  }
}
