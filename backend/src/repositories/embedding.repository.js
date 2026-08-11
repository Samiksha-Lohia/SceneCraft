import BaseRepository from './base.repository.js';
import Embedding from '../models/embedding.model.js';

class EmbeddingRepository extends BaseRepository {
  constructor() {
    super(Embedding);
  }

  async findByDocumentId(documentId, options = {}) {
    return this.find({ documentId }, null, options);
  }
}

const embeddingRepositoryInstance = new EmbeddingRepository();
export default embeddingRepositoryInstance;
export { EmbeddingRepository };
