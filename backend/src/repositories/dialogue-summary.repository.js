import BaseRepository from './base.repository.js';
import DialogueSummary from '../models/dialogue-summary.model.js';

class DialogueSummaryRepository extends BaseRepository {
  constructor() {
    super(DialogueSummary);
  }

  async findBySceneId(sceneId, options = {}) {
    return this.find({ sceneId }, null, options);
  }

  async findByCharacterId(documentId, characterId, options = {}) {
    return this.find({ documentId, characterId }, null, options);
  }

  async findSpecificDialogue(sceneId, characterId, options = {}) {
    return this.findOne({ sceneId, characterId }, null, options);
  }
}

const dialogueSummaryRepositoryInstance = new DialogueSummaryRepository();
export default dialogueSummaryRepositoryInstance;
export { DialogueSummaryRepository };
