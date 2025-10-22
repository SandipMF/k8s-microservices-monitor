import { Queue } from "bullmq";
import express, { Application, Request, Response } from "express";
import { Gauge, register } from "prom-client";
import { Job } from "./models/Job.model";
import statsRoutes from "./routes/stats.routes";
import { connectDatabase } from "./config/database";

const app: Application = express();
const PORT = process.env.PORT || 3002;

app.use(express.json());

// Redis connection setup
const REDIS_HOST = process.env.REDIS_HOST || "redis-service";
const REDIS_PORT = parseInt(process.env.REDIS_PORT || "6379");

const connection = {
  host: REDIS_HOST,
  port: REDIS_PORT,
  maxRetriesPerRequest: null,
};

const jobQueue = new Queue("jobs", { connection });

// Prometheus metrics
const totalJobsSubmitted = new Gauge({
  name: "total_jobs_submitted",
  help: "Total number of jobs submitted to the system",
});

const totalJobsCompleted = new Gauge({
  name: "total_jobs_completed",
  help: "Total number of jobs completed successfully",
});

const totalJobsFailed = new Gauge({
  name: "total_jobs_failed",
  help: "Total number of jobs that failed",
});

const queueLength = new Gauge({
  name: "queue_length",
  help: "Current length of the job queue",
});

const activeJobs = new Gauge({
  name: "active_jobs",
  help: "Number of jobs currently being processed",
});

// Update metrics periodically
const updateMetrics = async () => {
  try {
    const [waiting, active] = await Promise.all([
      jobQueue.getWaitingCount(),
      jobQueue.getActiveCount(),
    ]);

    const [total, completed, failed] = await Promise.all([
      Job.countDocuments(),
      Job.countDocuments({ status: "completed" }),
      Job.countDocuments({ status: "failed" }),
    ]);

    totalJobsSubmitted.set(total);
    totalJobsCompleted.set(completed);
    totalJobsFailed.set(failed);
    queueLength.set(waiting);
    activeJobs.set(active);
  } catch (error) {
    console.error("Error updating metrics:", error);
  }
};

// Update metrics every 5 seconds
setInterval(updateMetrics, 5000);

// Routes
app.use("/api", statsRoutes);

// Metrics endpoint
app.get("/metrics", async (_req: Request, res: Response) => {
  await updateMetrics();
  res.set("Content-Type", register.contentType);
  res.end(await register.metrics());
});

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "job-stats",
    timestamp: new Date().toISOString(),
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    await updateMetrics(); // Initial metrics update

    app.listen(PORT, () => {
      console.log(`Job Stats Service running on port ${PORT}`);
      console.log(`Metrics available at http://localhost:${PORT}/metrics`);
    });
  } catch (error) {
    console.error("Failed to start stats service:", error);
    process.exit(1);
  }
};

startServer();
