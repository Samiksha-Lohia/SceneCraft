import BaseRepository from './base.repository.js';
import Scene from '../models/scene.model.js';

class SceneRepository extends BaseRepository {
  constructor() {
    super(Scene);
  }

  async findScenesByDocumentIdOrdered(documentId, options = {}) {
    return this.find({ documentId }, null, { sort: { sceneNumber: 1 }, ...options });
  }

  async findSceneByNumber(documentId, sceneNumber, options = {}) {
    return this.findOne({ documentId, sceneNumber }, null, options);
  }
}

const sceneRepositoryInstance = new SceneRepository();
export default sceneRepositoryInstance;
export { SceneRepository };
