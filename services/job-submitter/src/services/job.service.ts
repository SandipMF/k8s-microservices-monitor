import { v4 as uuidv4 } from "uuid";
import { Queue } from "bullmq";
import { jobRepository, isValidJobType, IJob, JobType, JobStatus } from "@microservices/shared-database";
import { REDIS_HOST, REDIS_PORT } from "../config/env.config";

// DTOs (Data Transfer Objects)
export interface SubmitJobRequest {
  type: JobType;
}

export interface SubmitJobResponse {
  success: boolean;
  jobId: string;
  message: string;
  data: {
    jobId: string;
    type: JobType;
    status: JobStatus;
    createdAt: Date;
  };
}

export interface JobStatusResponse {
  jobId: string;
  type: JobType;
  status: JobStatus;
  result?: any;
  processingTime?: number;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface JobListResponse {
  jobs: IJob[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Custom exceptions
export class InvalidJobTypeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "InvalidJobTypeError";
  }
}

export class JobNotFoundError extends Error {
  constructor(jobId: string) {
    super(`Job with ID ${jobId} not found`);
    this.name = "JobNotFoundError";
  }
}

/**
 * Job Service - Business logic for job operations
 */
export class JobService {
  private jobQueue: Queue;

  constructor() {
    // BullMQ Queue setup
    const connection = {
      host: REDIS_HOST,
      port: REDIS_PORT,
      maxRetriesPerRequest: null,
    };
    this.jobQueue = new Queue("jobs", { connection });
  }

  /**
   * Submit a new job
   */
  async submitJob(request: SubmitJobRequest): Promise<SubmitJobResponse> {
    // Validate job type
    if (!isValidJobType(request.type)) {
      throw new InvalidJobTypeError(
        "Invalid job type. Must be one of: prime, bcrypt, or sort"
      );
    }

    // Generate unique job ID
    const jobId = uuidv4();

    // Create job in MongoDB
    const job = await jobRepository.create({
      jobId,
      type: request.type,
      status: "queued",
    });

    // Add job to Redis queue
    await this.jobQueue.add(
      "process-job",
      {
        jobId,
        type: job.type,
        timeStamp: Date.now(),
      },
      { jobId }
    );

    return {
      success: true,
      jobId,
      message: "Job submitted successfully",
      data: {
        jobId: job.jobId,
        type: job.type,
        status: job.status,
        createdAt: job.createdAt,
      },
    };
  }

  /**
   * Get job status by jobId
   */
  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    const job = await jobRepository.findById(jobId);

    if (!job) {
      throw new JobNotFoundError(jobId);
    }

    return {
      jobId: job.jobId,
      type: job.type,
      status: job.status,
      result: job.result,
      processingTime: job.processingTime,
      error: job.error,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
    };
  }

  /**
   * Get list of jobs with pagination
   */
  async getJobs(
    page: number = 1,
    limit: number = 10,
    status?: JobStatus
  ): Promise<JobListResponse> {
    const { jobs, total } = await jobRepository.find(
      status ? { status } : {},
      {
        page,
        limit,
        sort: { createdAt: -1 },
      }
    );

    return {
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Cleanup resources
   */
  async close(): Promise<void> {
    await this.jobQueue.close();
  }
}

// Export singleton instance
export const jobService = new JobService();
