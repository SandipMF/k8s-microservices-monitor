// Main exports for the shared database package
export { IJob, Job } from "./models/Job.model";
export { DatabaseManager, DatabaseConfig, databaseManager } from "./config/database";

// Re-export mongoose for convenience
export * from "mongoose";
