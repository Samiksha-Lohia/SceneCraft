import { Queue } from 'bullmq';

import { redis } from '../config/redis.js';

const PIPELINE_QUEUE_NAME = 'scenecraft-pipeline';

const pipelineQueue = new Queue(PIPELINE_QUEUE_NAME, {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 250 },
    removeOnFail: { count: 500 },
  },
});

export { PIPELINE_QUEUE_NAME, pipelineQueue };
