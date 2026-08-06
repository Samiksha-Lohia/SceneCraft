export class ContinuityIssueDto {
  constructor(issue) {
    this.id = issue._id || issue.id;
    this.documentId = issue.documentId;
    this.type = issue.type;
    this.description = issue.description;
    this.sceneIds = issue.sceneIds || [];
    this.severity = issue.severity || 'medium';
    this.status = issue.status || 'open';
    this.createdAt = issue.createdAt;
    this.updatedAt = issue.updatedAt;
  }

  static toResponse(issue) {
    if (!issue) return null;
    return new ContinuityIssueDto(issue);
  }

  static toResponseList(issues) {
    if (!Array.isArray(issues)) return [];
    return issues.map(issue => new ContinuityIssueDto(issue));
  }
}
