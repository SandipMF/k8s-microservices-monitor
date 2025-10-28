import { Router, Request, Response } from "express";
import { statsService } from "../services/stats.service";

const router = Router();

// Get comprehensive stats
router.get("/stats", async (_req: Request, res: Response): Promise<void> => {
  try {
    const result = await statsService.getComprehensiveStats();
    res.json(result);
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
      const result = await statsService.getAnalytics();
      res.json(result);
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
