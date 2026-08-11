export class DialogueSummaryDto {
  constructor(diag) {
    this.id = diag._id || diag.id;
    this.documentId = diag.documentId;
    this.sceneId = diag.sceneId;
    this.characterId = diag.characterId;
    this.summaryText = diag.summaryText;
    this.keyQuotes = diag.keyQuotes || [];
    this.tone = diag.tone || '';
    this.createdAt = diag.createdAt;
    this.updatedAt = diag.updatedAt;
  }

  static toResponse(diag) {
    if (!diag) return null;
    return new DialogueSummaryDto(diag);
  }

  static toResponseList(diags) {
    if (!Array.isArray(diags)) return [];
    return diags.map(diag => new DialogueSummaryDto(diag));
  }
}
