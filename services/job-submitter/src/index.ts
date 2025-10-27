import express, { Application, Request, Response } from "express";
import { connectDatabase } from "./config/database";
import jobRoutes from "./routes/job.routes";

const app: Application = express();
import { PORT } from "./config/env.config";

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use("/api", jobRoutes);

// Health check
app.get("/health", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "job-submitter",
    timestamp: new Date().toISOString(),
  });
});

// Start server
const startServer = async () => {
  try {
    await connectDatabase();
    app.listen(PORT, () => {
      console.log(`Server of Job Submitter Service is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
