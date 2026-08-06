export const JOB_STATUSES = {
  QUEUED: 'queued',
  RUNNING: 'running',
  COMPLETED: 'completed',
  FAILED: 'failed'
};

export const JOB_STATUS_LIST = Object.values(JOB_STATUSES);

export const DOCUMENT_STATUSES = {
  UPLOADED: 'uploaded',
  PROCESSING: 'processing',
  READY: 'ready',
  FAILED: 'failed'
};

export const DOCUMENT_STATUS_LIST = Object.values(DOCUMENT_STATUSES);

export const CONTINUITY_SEVERITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high'
};

export const CONTINUITY_SEVERITY_LIST = Object.values(CONTINUITY_SEVERITIES);

export const CONTINUITY_STATUSES = {
  OPEN: 'open',
  REVIEWED: 'reviewed',
  DISMISSED: 'dismissed',
  RESOLVED: 'resolved'
};

export const CONTINUITY_STATUS_LIST = Object.values(CONTINUITY_STATUSES);
