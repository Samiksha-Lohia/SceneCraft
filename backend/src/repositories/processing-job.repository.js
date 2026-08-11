import BaseRepository from './base.repository.js';
import ProcessingJob from '../models/processing-job.model.js';

class ProcessingJobRepository extends BaseRepository {
  constructor() {
    super(ProcessingJob);
  }

  async findByDocumentId(documentId, options = {}) {
    return this.find({ documentId }, null, options);
  }

  async findStageJob(documentId, stage, options = {}) {
    return this.findOne({ documentId, stage }, null, options);
  }

  async updateStageProgress(documentId, stage, progress, updateData = {}, options = {}) {
    return this.updateOne(
      { documentId, stage },
      { progress, ...updateData },
      options
    );
  }
}

const processingJobRepositoryInstance = new ProcessingJobRepository();
export default processingJobRepositoryInstance;
export { ProcessingJobRepository };
