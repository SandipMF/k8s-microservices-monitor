import mongoose, { Schema, Document, Model } from "mongoose";

// Define the Job interface
export interface IJob extends Document {
  jobId: string;
  type: "prime" | "bcrypt" | "sort";
  status: "queued" | "processing" | "completed" | "failed";
  result?: any;
  processingTime?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Define the Job schema
const JobSchema = new Schema<IJob>(
  {
    jobId: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: ["prime", "bcrypt", "sort"], required: true },
    status: {
      type: String,
      enum: ["queued", "processing", "completed", "failed"],
      default: "queued",
      index: true,
    },
    result: { type: Schema.Types.Mixed },
    processingTime: { type: Number },
    error: { type: String },
    completedAt: { type: Date },
  },
  { timestamps: true }
);

// Create indexes for efficient querying
JobSchema.index({ createdAt: -1 });
JobSchema.index({ status: 1, createdAt: -1 });

// Export the Job model
export const Job: Model<IJob> = mongoose.model<IJob>("Job", JobSchema);
