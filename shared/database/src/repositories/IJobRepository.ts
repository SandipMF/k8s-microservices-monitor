import { IJob } from "../models/Job.model";
import { JobStatus, JobType } from "../types/job.types";

// Interface for job creation data
export interface CreateJobData {
  jobId: string;
  type: JobType;
  status?: JobStatus;
}

// Interface for job update data
export interface UpdateJobData {
  status?: JobStatus;
  result?: any;
  processingTime?: number;
  error?: string;
  completedAt?: Date;
}

// Interface for job query filters
export interface JobQueryFilters {
  status?: JobStatus;
  type?: JobType;
  jobId?: string;
}

// Interface for pagination options
export interface PaginationOptions {
  page?: number;
  limit?: number;
  sort?: Record<string, 1 | -1>;
}

// Job Repository Interface - Abstraction for data access
export interface IJobRepository {
  /**
   * Create a new job
   */
  create(data: CreateJobData): Promise<IJob>;

  /**
   * Find a job by jobId
   */
  findById(jobId: string): Promise<IJob | null>;

  /**
   * Find jobs with filters and pagination
   */
  find(
    filters?: JobQueryFilters,
    options?: PaginationOptions
  ): Promise<{ jobs: IJob[]; total: number }>;

  /**
   * Update a job by jobId
   */
  updateById(jobId: string, data: UpdateJobData): Promise<IJob | null>;

  /**
   * Count documents with filters
   */
  count(filters?: JobQueryFilters): Promise<number>;

  /**
   * Count documents by status
   */
  countByStatus(status: JobStatus): Promise<number>;

  /**
   * Aggregate jobs by type and status
   */
  aggregateByTypeAndStatus(): Promise<any[]>;

  /**
   * Calculate average processing time for completed jobs
   */
  getAverageProcessingTime(): Promise<number>;

  /**
   * Update job status (convenience method)
   */
  updateStatus(jobId: string, status: JobStatus): Promise<IJob | null>;

  /**
   * Update job with result (convenience method)
   */
  updateWithResult(
    jobId: string,
    result: any,
    processingTime: number,
    error?: string
  ): Promise<IJob | null>;
}

// Export types for use in other files
export type { JobStatus, JobType } from "../types/job.types";
