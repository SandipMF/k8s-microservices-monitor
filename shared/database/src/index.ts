// Main exports for the shared database package
export { IJob, Job } from "./models/Job.model";
export { DatabaseManager, DatabaseConfig, databaseManager } from "./config/database";
export { JobType, JobStatus, JOB_TYPES, JOB_STATUSES, isValidJobType, isValidJobStatus } from "./types/job.types";

// Repository pattern exports
export { jobRepository, RepositoryFactory, IJobRepository, MongoDBJobRepository } from "./repositories";
export type { CreateJobData, UpdateJobData, JobQueryFilters, PaginationOptions } from "./repositories";

// Re-export mongoose for convenience (but services should prefer repository pattern)
export * from "mongoose";
