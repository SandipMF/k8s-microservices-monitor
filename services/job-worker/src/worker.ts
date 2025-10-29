import { Worker, Job as BullJob } from "bullmq";
import express, { Application, Request, Response } from "express";
import { Counter, Histogram, register } from "prom-client";
import { JobData, processJob } from "./processors/job.processor";
import { connectDatabase } from "./config/database";
import { PORT, REDIS_HOST, REDIS_PORT } from "./config/env.config";

const app: Application = express();

// Redis connection
const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
};

// Prometheus metrics
const jobsProcessedTotal = new Counter({
  name: "jobs_processed_total",
  help: "Total number of jobs processed",
  labelNames: ["type", "status"],
});

const jobProcessingTime = new Histogram({
  name: "job_processing_time_seconds",
  help: "Time taken to process jobs in seconds",
  labelNames: ["type"],
  buckets: [0.1, 0.5, 1, 2, 5, 10, 30],
});

const jobErrorsTotal = new Counter({
  name: "job_errors_total",
  help: "Total number of job processing errors",
  labelNames: ["type", "error"],
});

// BullMQ Worker
const worker = new Worker<JobData>(
  "jobs",
  async (job: BullJob<JobData>) => {
    // Start processing time measurement
    const startTime = Date.now();
    const { type } = job.data;

    try {
      // Process job
      const result = await processJob(job);

      // Track job processing time
      const processingTime = (Date.now() - startTime) / 1000;
      jobsProcessedTotal.labels(type, "success").inc();
      jobProcessingTime.labels(type).observe(processingTime);

      return result;
    } catch (error: any) {
      jobsProcessedTotal.labels(type, "failed").inc();
      jobErrorsTotal.labels(type, error.name || "UnknownError").inc();
      throw error;
    }
  },
  {
    connection,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

// Worker event handlers
worker.on("completed", (job: BullJob) => {
  console.log(`Job ${job.id} completed successfully`);
});

worker.on("failed", (job: BullJob | undefined, err: Error) => {
  console.error(`Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err: Error) => {
  console.error("Worker error:", err);
});

// Metrics endpoint
app.get("/metrics", async (_req: Request, res: Response) => {
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "job-worker",
    timestamp: new Date().toISOString(),
    worker: worker.isRunning() ? "active" : "inactive",
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();

    app.listen(PORT, () => {
      console.log(`Job Worker Service running on port ${PORT}`);
      console.log(`Metrics available at http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    console.error("Failed to start worker:", error);
    process.exit(1);
  }
};

startServer();
