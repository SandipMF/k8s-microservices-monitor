import { Queue } from "bullmq";
import { jobRepository } from "@microservices/shared-database";
import { REDIS_HOST, REDIS_PORT } from "../config/env.config";

// DTOs (Data Transfer Objects)
export interface QueueStats {
  waiting: number;
  active: number;
  delayed: number;
  failed: number;
}

export interface DatabaseStats {
  total: number;
  completed: number;
  failed: number;
  processing: number;
  queued: number;
}

export interface PerformanceStats {
  avgProcessingTime: number;
  statsByType: any[];
}

export interface ComprehensiveStatsResponse {
  queue: QueueStats;
  database: DatabaseStats;
  performance: PerformanceStats;
  timestamp: string;
}

export interface AnalyticsResponse {
  analytics: any[];
  timestamp: string;
}

/**
 * Stats Service - Business logic for statistics and analytics
 */
export class StatsService {
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
   * Get comprehensive statistics
   */
  async getComprehensiveStats(): Promise<ComprehensiveStatsResponse> {
    // Queue stats from Redis
    const [waiting, active, delayed, failed] = await Promise.all([
      this.jobQueue.getWaitingCount(),
      this.jobQueue.getActiveCount(),
      this.jobQueue.getDelayedCount(),
      this.jobQueue.getFailedCount(),
    ]);

    // Database stats using repository
    const [totalJobs, completedJobs, failedJobs, processingJobs, queuedJobs] =
      await Promise.all([
        jobRepository.count(),
        jobRepository.countByStatus("completed"),
        jobRepository.countByStatus("failed"),
        jobRepository.countByStatus("processing"),
        jobRepository.countByStatus("queued"),
      ]);

    // Average processing time using repository
    const avgProcessingTime = await jobRepository.getAverageProcessingTime();

    // Stats by job type using repository
    const statsByType = await jobRepository.aggregateByTypeAndStatus();

    return {
      queue: {
        waiting,
        active,
        delayed,
        failed,
      },
      database: {
        total: totalJobs,
        completed: completedJobs,
        failed: failedJobs,
        processing: processingJobs,
        queued: queuedJobs,
      },
      performance: {
        avgProcessingTime: parseFloat(avgProcessingTime.toFixed(3)),
        statsByType,
      },
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get analytics data
   */
  async getAnalytics(): Promise<AnalyticsResponse> {
    const analytics = await jobRepository.aggregateByTypeAndStatus();

    return {
      analytics,
      timestamp: new Date().toISOString(),
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
export const statsService = new StatsService();
