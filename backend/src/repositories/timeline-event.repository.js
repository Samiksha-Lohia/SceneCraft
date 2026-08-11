import BaseRepository from './base.repository.js';
import TimelineEvent from '../models/timeline-event.model.js';

class TimelineEventRepository extends BaseRepository {
  constructor() {
    super(TimelineEvent);
  }

  async findByDocumentIdChronological(documentId, options = {}) {
    return this.find({ documentId }, null, { sort: { chronologicalOrder: 1 }, ...options });
  }

  async findBySceneId(sceneId, options = {}) {
    return this.findOne({ sceneId }, null, options);
  }
}

const timelineEventRepositoryInstance = new TimelineEventRepository();
export default timelineEventRepositoryInstance;
export { TimelineEventRepository };
