export class RelationshipDto {
  constructor(rel) {
    this.id = rel._id || rel.id;
    this.documentId = rel.documentId;
    this.characterAId = rel.characterAId;
    this.characterBId = rel.characterBId;
    this.type = rel.type || 'other';
    this.sentimentScore = rel.sentimentScore || 0;
    this.sentimentBySceneId = rel.sentimentBySceneId instanceof Map 
      ? Object.fromEntries(rel.sentimentBySceneId) 
      : rel.sentimentBySceneId || {};
    this.sceneIds = rel.sceneIds || [];
    this.createdAt = rel.createdAt;
    this.updatedAt = rel.updatedAt;
  }

  static toResponse(rel) {
    if (!rel) return null;
    return new RelationshipDto(rel);
  }

  static toResponseList(rels) {
    if (!Array.isArray(rels)) return [];
    return rels.map(rel => new RelationshipDto(rel));
  }
}
