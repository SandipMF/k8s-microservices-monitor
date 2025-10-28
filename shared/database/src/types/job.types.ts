// Shared types and constants
export const JOB_TYPES = ["prime", "bcrypt", "sort"] as const;
export const JOB_STATUSES = ["queued", "processing", "completed", "failed"] as const;

export type JobType = typeof JOB_TYPES[number];
export type JobStatus = typeof JOB_STATUSES[number];

// Validation helpers
export const isValidJobType = (type: string): type is JobType => {
  return JOB_TYPES.includes(type as JobType);
};

export const isValidJobStatus = (status: string): status is JobStatus => {
  return JOB_STATUSES.includes(status as JobStatus);
};
