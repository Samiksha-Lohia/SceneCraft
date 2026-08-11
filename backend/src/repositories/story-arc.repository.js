import BaseRepository from './base.repository.js';
import StoryArc from '../models/story-arc.model.js';

class StoryArcRepository extends BaseRepository {
  constructor() {
    super(StoryArc);
  }

  async findByDocumentId(documentId, options = {}) {
    return this.findOne({ documentId }, null, options);
  }
}

const storyArcRepositoryInstance = new StoryArcRepository();
export default storyArcRepositoryInstance;
export { StoryArcRepository };
