import { IJob, Job } from "../models/Job.model";
import { JobStatus } from "../types/job.types";
import {
  IJobRepository,
  CreateJobData,
  UpdateJobData,
  JobQueryFilters,
  PaginationOptions,
} from "./IJobRepository";

/**
 * MongoDB implementation of Job Repository
 * Uses Mongoose models for data access
 */
export class MongoDBJobRepository implements IJobRepository {
  /**
   * Create a new job
   */
  async create(data: CreateJobData): Promise<IJob> {
    const job = await Job.create({
      jobId: data.jobId,
      type: data.type,
      status: data.status || "queued",
    });
    return job;
  }

  /**
   * Find a job by jobId
   */
  async findById(jobId: string): Promise<IJob | null> {
    return await Job.findOne({ jobId });
  }

  /**
   * Find jobs with filters and pagination
   */
  async find(
    filters: JobQueryFilters = {},
    options: PaginationOptions = {}
  ): Promise<{ jobs: IJob[]; total: number }> {
    const {
      page = 1,
      limit = 10,
      sort = { createdAt: -1 },
    } = options;

    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.jobId) query.jobId = filters.jobId;

    const skip = (page - 1) * limit;

    const [jobs, total] = await Promise.all([
      Job.find(query).sort(sort).limit(limit).skip(skip),
      Job.countDocuments(query),
    ]);

    return { jobs, total };
  }

  /**
   * Update a job by jobId
   */
  async updateById(jobId: string, data: UpdateJobData): Promise<IJob | null> {
    const updateData: any = {};
    if (data.status) updateData.status = data.status;
    if (data.result !== undefined) updateData.result = data.result;
    if (data.processingTime) updateData.processingTime = data.processingTime;
    if (data.error) updateData.error = data.error;
    if (data.completedAt) updateData.completedAt = data.completedAt;

    return await Job.findOneAndUpdate(
      { jobId },
      updateData,
      { new: true }
    );
  }

  /**
   * Count documents with filters
   */
  async count(filters: JobQueryFilters = {}): Promise<number> {
    const query: any = {};
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    if (filters.jobId) query.jobId = filters.jobId;

    return await Job.countDocuments(query);
  }

  /**
   * Count documents by status
   */
  async countByStatus(status: JobStatus): Promise<number> {
    return await Job.countDocuments({ status });
  }

  /**
   * Aggregate jobs by type and status
   */
  async aggregateByTypeAndStatus(): Promise<any[]> {
    return await Job.aggregate([
      {
        $group: {
          _id: {
            type: "$type",
            status: "$status",
          },
          count: { $sum: 1 },
          avgTime: {
            $avg: {
              $cond: [
                { $eq: ["$status", "completed"] },
                "$processingTime",
                null,
              ],
            },
          },
        },
      },
      { $sort: { "_id.type": 1, "_id.status": 1 } },
    ]);
  }

  /**
   * Calculate average processing time for completed jobs
   */
  async getAverageProcessingTime(): Promise<number> {
    const result = await Job.aggregate([
      {
        $match: {
          status: "completed",
          processingTime: { $exists: true },
        },
      },
      {
        $group: {
          _id: null,
          avgTime: { $avg: "$processingTime" },
        },
      },
    ]);

    return result.length > 0 ? result[0].avgTime : 0;
  }

  /**
   * Update job with result (convenience method)
   */
  async updateWithResult(
    jobId: string,
    result: any,
    processingTime: number,
    error?: string
  ): Promise<IJob | null> {
    const updateData: UpdateJobData = {
      result,
      processingTime,
      completedAt: new Date(),
    };

    if (error) {
      updateData.error = error;
      updateData.status = "failed";
    } else {
      updateData.status = "completed";
    }

    return await this.updateById(jobId, updateData);
  }

  /**
   * Update job status (convenience method)
   */
  async updateStatus(
    jobId: string,
    status: JobStatus
  ): Promise<IJob | null> {
    return await this.updateById(jobId, { status });
  }
}
