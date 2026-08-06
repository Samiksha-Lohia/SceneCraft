import BaseRepository from './base.repository.js';
import Document from '../models/document.model.js';

class DocumentRepository extends BaseRepository {
  constructor() {
    super(Document);
  }

  async findByUserId(userId, options = {}) {
    return this.find({ userId }, null, { sort: { uploadedAt: -1 }, ...options });
  }
}

const documentRepositoryInstance = new DocumentRepository();
export default documentRepositoryInstance;
export { DocumentRepository };
