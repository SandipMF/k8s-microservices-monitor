import { Router, Request, Response } from "express";
import { jobService, InvalidJobTypeError, JobNotFoundError } from "../services/job.service";

const router = Router();

// Submit job endpoint
router.post("/submit", async (req: Request, res: Response): Promise<void> => {
  try {
    const result = await jobService.submitJob({ type: req.body.type });
    res.status(201).json(result);
  } catch (error: any) {
    if (error instanceof InvalidJobTypeError) {
      res.status(400).json({ error: error.message });
      return;
    }
    console.error("Error submitting job:", error);
    res.status(500).json({ 
      error: "Failed to submit job", 
      details: error.message 
    });
  }
});

// Check job status endpoint
router.get(
  "/status/:id",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const jobId = req.params.id;
      const result = await jobService.getJobStatus(jobId);
      res.json(result);
    } catch (error: any) {
      if (error instanceof JobNotFoundError) {
        res.status(404).json({ error: error.message });
        return;
      }
      console.error("Error checking status:", error);
      res.status(500).json({ 
        error: "Failed to check status", 
        details: error.message 
      });
    }
  }
);

// Get all jobs (with pagination)
router.get("/jobs", async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const status = req.query.status as string | undefined;

    const result = await jobService.getJobs(page, limit, status as any);
    res.json(result);
  } catch (error: any) {
    console.error("Error fetching jobs:", error);
    res.status(500).json({ 
      error: "Failed to fetch jobs", 
      details: error.message 
    });
  }
});

export default router;
