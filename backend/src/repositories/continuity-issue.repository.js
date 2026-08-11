import BaseRepository from './base.repository.js';
import ContinuityIssue from '../models/continuity-issue.model.js';

class ContinuityIssueRepository extends BaseRepository {
  constructor() {
    super(ContinuityIssue);
  }

  async findByDocumentId(documentId, options = {}) {
    return this.find({ documentId }, null, { sort: { severity: -1, createdAt: -1 }, ...options });
  }
}

const continuityIssueRepositoryInstance = new ContinuityIssueRepository();
export default continuityIssueRepositoryInstance;
export { ContinuityIssueRepository };
