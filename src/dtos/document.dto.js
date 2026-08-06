export class DocumentDto {
  constructor(doc) {
    this.id = doc._id || doc.id;
    this.userId = doc.userId;
    this.title = doc.title;
    this.originalFilename = doc.originalFilename;
    this.fileType = doc.fileType;
    this.storageUrl = doc.storageUrl;
    this.status = doc.status;
    this.wordCount = doc.wordCount || 0;
    this.totalScenes = doc.totalScenes || 0;
    this.uploadedAt = doc.uploadedAt;
  }

  static toResponse(doc) {
    if (!doc) return null;
    return new DocumentDto(doc);
  }

  static toResponseList(docs) {
    if (!Array.isArray(docs)) return [];
    return docs.map(doc => new DocumentDto(doc));
  }
}
