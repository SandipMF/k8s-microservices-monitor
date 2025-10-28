import { Queue } from "bullmq";
import { Router, Request, Response } from "express";
import { jobRepository } from "@microservices/shared-database";
import { REDIS_HOST, REDIS_PORT } from "../config/env.config";

const router = Router();

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
};

const jobQueue = new Queue("jobs", { connection });

// Get comprehensive stats
router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    // Queue stats from Redis
    const [waiting, active, delayed, failed] = await Promise.all([
      jobQueue.getWaitingCount(),
      jobQueue.getActiveCount(),
      jobQueue.getDelayedCount(),
      jobQueue.getFailedCount(),
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

    // Construct response
    res.json({
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
    });
  } catch (error: any) {
    console.error("Error getting stats:", error);
    res.status(500).json({
      error: "Failed to get stats",
      details: error.message,
    });
  }
});

// Get analytics
router.get(
  "/analytics",
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const analytics = await jobRepository.aggregateByTypeAndStatus();

      //   construct response
      res.json({ analytics, timestamp: new Date().toISOString() });
    } catch (error: any) {
      console.error("Error getting analytics:", error);
      res.status(500).json({
        error: "Failed to get analytics",
        details: error.message,
      });
    }
  }
);

export default router;
