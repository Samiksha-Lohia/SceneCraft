import BaseRepository from './base.repository.js';
import MoodAnalysis from '../models/mood-analysis.model.js';

class MoodAnalysisRepository extends BaseRepository {
  constructor() {
    super(MoodAnalysis);
  }

  async findBySceneId(sceneId, options = {}) {
    return this.findOne({ sceneId }, null, options);
  }

  async findByDocumentId(documentId, options = {}) {
    return this.find({ documentId }, null, options);
  }
}

const moodAnalysisRepositoryInstance = new MoodAnalysisRepository();
export default moodAnalysisRepositoryInstance;
export { MoodAnalysisRepository };
