import mongoose, { Document, Model, Schema } from "mongoose";
import { JobType, JobStatus, JOB_TYPES, JOB_STATUSES } from "../types/job.types";

// Job interface
export interface IJob extends Document {
  jobId: string;
  type: JobType;
  status: JobStatus;
  result?: any;
  processingTime?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Job schema
const JobSchema = new Schema<IJob>(
  {
    jobId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    type: {
      type: String,
      enum: JOB_TYPES,
      required: true,
    },
    status: {
      type: String,
      enum: JOB_STATUSES,
      default: "queued",
      index: true,
    },
    result: {
      type: Schema.Types.Mixed,
    },
    processingTime: {
      type: Number,
    },
    error: {
      type: String,
    },
    completedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
JobSchema.index({ createdAt: -1 });
JobSchema.index({ status: 1, createdAt: -1 });

// Job model
export const Job: Model<IJob> = mongoose.model<IJob>("Job", JobSchema);