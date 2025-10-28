import { Queue } from "bullmq";
import { Router, Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { Job } from "@microservices/shared-database";
import { REDIS_HOST, REDIS_PORT } from "../config/env.config";

const router = Router();

// BullMQ Queue setup
const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
};

const jobQueue = new Queue("jobs", { connection });

// Submit job endpoint
router.post("/submit", async (req: Request, res: Response): Promise<void> => {
  try {
    // Generate unique job ID
    const jobId = uuidv4();

    // Extract job type from request body
    const jobType = req.body.type;

    // Validate job type
    if (!["prime", "bcrypt", "sort"].includes(jobType)) {
      res
        .status(400)
        .json({ error: "Invalid job type. Must be: prime, bcrypt, or sort" });
      return;
    }

    // Create job in MongoDB
    const job = await Job.create({ jobId, type: jobType, status: "queued" });

    // Add job to Redis queue
    await jobQueue.add(
      "process-job",
      {
        jobId,
        type: job.type,
        timeStamp: Date.now(),
      },
      { jobId }
    );

    // Return job submission response
    res.status(201).json({
      success: true,
      jobId,
      message: "Job submitted successfully",
      data: {
        jobId: job.jobId,
        type: job.type,
        status: job.status,
        createdAt: job.createdAt,
      },
    });
  } catch (error: any) {
    console.error("Error submitting job:", error);
    res
      .status(500)
      .json({ error: "Failed to submit job", details: error.message });
  }
});

// Check job status endpoint
router.get(
  "/status/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      // Find job by jobId
      const jobId = req.params.id;

      // Find job in MongoDB
      const job = await Job.findOne({ jobId });

      // If job not found, return 404
      if (!job) {
        res.status(404).json({ error: "Job not found" });
        return;
      }

      // Return job status
      res.json({
        jobId: job.jobId,
        type: job.type,
        status: job.status,
        result: job.result,
        processingTime: job.processingTime,
        error: job.error,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
      });
    } catch (error: any) {
      console.error("Error checking status:", error);
      res
        .status(500)
        .json({ error: "Failed to check status", details: error.message });
    }
  }
);

// Get all jobs (with pagination)
router.get("/jobs", async (req: Request, res: Response): Promise<void> => {
  try {
    // retrieve query params
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string;

    const query = status ? { status } : {};

    // Fetch jobs from MongoDB with pagination
    const jobs = await Job.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const total = await Job.countDocuments(query);

    // Return jobs with pagination info
    res.json({
      jobs,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    res
      .status(500)
      .json({ error: "Failed to fetch jobs", details: error.message });
  }
});

export default router;
