export class AnalysisDto {
  constructor(job) {
    this.id = job._id || job.id;
    this.documentId = job.documentId;
    this.stage = job.stage;
    this.status = job.status;
    this.progress = job.progress || 0;
    this.dependsOn = job.dependsOn || [];
    this.error = job.error || null;
    this.startedAt = job.startedAt || null;
    this.completedAt = job.completedAt || null;
  }

  static toResponse(job) {
    if (!job) return null;
    return new AnalysisDto(job);
  }

  static toResponseList(jobs) {
    if (!Array.isArray(jobs)) return [];
    return jobs.map(job => new AnalysisDto(job));
  }
}
