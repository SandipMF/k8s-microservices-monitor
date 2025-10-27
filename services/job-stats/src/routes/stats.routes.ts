import { Queue } from "bullmq";
import { Router, Request, Response } from "express";
import { Job } from "../models/Job.model";
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

    // Database stats
    const [totalJobs, completedJobs, failedJobs, processingJobs, queuedJobs] =
      await Promise.all([
        Job.countDocuments(),
        Job.countDocuments({ status: "completed" }),
        Job.countDocuments({ status: "failed" }),
        Job.countDocuments({ status: "processing" }),
        Job.countDocuments({ status: "queued" }),
      ]);

    // Average processing time
    const avgTimeResult = await Job.aggregate([
      { $match: { status: "completed", processingTime: { $exists: true } } },
      { $group: { _id: null, avgTime: { $avg: "$processingTime" } } },
    ]);

    // If no completed jobs, avgTimeResult will be empty
    const avgProcessingTime =
      avgTimeResult.length > 0 ? avgTimeResult[0].avgTime : 0;

    // Stats by job type
    const statsByType = await Job.aggregate([
      {
        $group: {
          _id: "$type",
          total: { $sum: 1 },
          completed: {
            $sum: { $cond: [{ $eq: ["$status", "completed"] }, 1, 0] },
          },
          failed: {
            $sum: { $cond: [{ $eq: ["$status", "failed"] }, 1, 0] },
          },
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
    ]);

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
      const analytics = await Job.aggregate([
        {
          $group: {
            _id: {
              type: "$type",
              status: "$status",
            },
            count: { $sum: 1 },
            avgTime: { $avg: "$processingTime" },
            maxTime: { $avg: "$processingTime" },
            minTime: { $avg: "$processingTime" },
          },
        },
        { $sort: { "_id.type": 1, "_id.status": 1 } },
      ]);

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
