import bcrypt from "bcrypt";
import { Job as BullJob } from "bullmq";
import { Job } from "../models/Job.model";

export interface JobData {
  jobId: string;
  type: "prime" | "bcrypt" | "sort";
  timeStamp: number;
}

export interface JobResult {
  count?: number;
  sample?: any[];
  hash?: string;
  rounds?: number;
}

// CPU-intensive: Calculate prime numbers
function calculatePrimes(limit: number): number[] {
  const primes: number[] = [];

  for (let num = 2; num <= limit; num++) {
    let isPrime = true;
    for (let i = 2; i <= Math.sqrt(num); i++) {
      if (num % i === 0) {
        isPrime = false;
        break;
      }
    }
    if (isPrime) {
      primes.push(num);
    }
  }

  return primes;
}

// CPU-intensive: Bcrypt hashing
async function performBcryptHash(): Promise<string> {
  const password = "testPassword" + Math.random();
  return await bcrypt.hash(password, 10);
}

// CPU-intensive: Generate and sort large array
function generateAndSortArray(size: number): number[] {
  const arr = Array.from({ length: size }, () =>
    Math.floor(Math.random() * 1000000)
  );
  return arr.sort((a, b) => a - b);
}

//
export async function processJob(job: BullJob<JobData>): Promise<JobResult> {
  const startTime = Date.now();
  const { jobId, type } = job.data;

  try {
    // Update job status to processing
    await Job.findOneAndUpdate({ jobId }, { status: "processing" });

    let result: JobResult;

    // Process based on job type
    switch (type) {
      case "prime":
        const primes = calculatePrimes(100000);
        result = { count: primes.length, sample: primes.slice(-10) };
        break;
      case "sort":
        const sorted = generateAndSortArray(100000);
        result = { count: sorted.length, sample: sorted.slice(0, 10) };
        break;
      case "bcrypt":
        const hash = await performBcryptHash();
        result = { hash, rounds: 10 };
        break;
      default:
        throw new Error(`Unknown job type: ${type}`);
    }

    const processingTime = (Date.now() - startTime) / 1000; // in seconds

    // Update job in MongoDB with results
    await Job.findOneAndUpdate(
      { jobId },
      {
        status: "completed",
        result,
        processingTime,
        completedAt: new Date(),
      }
    );

    console.log(`Job ${jobId} completed in ${processingTime.toFixed(2)}s`);

    return result;
  } catch (error: any) {
    console.error(`✗ Job ${jobId} failed:`, error);

    await Job.findOneAndUpdate(
      { jobId },
      {
        status: "failed",
        error: error.message,
        completedAt: new Date(),
      }
    );

    throw error;
  }
}
