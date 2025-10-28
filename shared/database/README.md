# Shared Database Package

This package provides shared database configuration and models for the microservices architecture.

## Features

- **Singleton Database Manager**: Ensures single database connection across services
- **Shared Models**: Common Mongoose models used by all services
- **Type Safety**: Full TypeScript support with interfaces
- **Connection Management**: Automatic connection pooling and error handling

## Installation

```bash
npm install file:../../shared/database
```

## Usage

### Database Connection

```typescript
import { databaseManager, DatabaseConfig } from "@microservices/shared-database";

const dbConfig: DatabaseConfig = {
  uri: "mongodb://localhost:27017/jobs_db",
  options: {
    maxPoolSize: 10,
    serverSelectionTimeoutMS: 5000,
  }
};

// Connect to database
await databaseManager.connect(dbConfig);

// Check connection status
if (databaseManager.isDatabaseConnected()) {
  console.log("Database is connected");
}

// Disconnect when shutting down
await databaseManager.disconnect();
```

### Using Models

```typescript
import { Job, IJob } from "@microservices/shared-database";

// Create a new job
const job = await Job.create({
  jobId: "unique-id",
  type: "prime",
  status: "queued"
});

// Find jobs
const jobs = await Job.find({ status: "completed" });

// Update job
await Job.findOneAndUpdate(
  { jobId: "unique-id" },
  { status: "completed", result: { count: 100 } }
);
```

## Models

### Job Model

The `Job` model represents a job in the system with the following fields:

- `jobId` (string): Unique identifier for the job
- `type` (enum): Job type - "prime", "bcrypt", or "sort"
- `status` (enum): Job status - "queued", "processing", "completed", or "failed"
- `result` (any): Job execution result
- `processingTime` (number): Time taken to process the job in seconds
- `error` (string): Error message if job failed
- `createdAt` (Date): Job creation timestamp
- `updatedAt` (Date): Job last update timestamp
- `completedAt` (Date): Job completion timestamp

## Database Manager API

### Methods

- `connect(config: DatabaseConfig): Promise<void>` - Connect to database
- `disconnect(): Promise<void>` - Disconnect from database
- `isDatabaseConnected(): boolean` - Check if database is connected
- `getConnectionState(): string` - Get current connection state

### Events

The database manager automatically handles MongoDB connection events:
- `disconnected` - Database disconnected
- `error` - Database error occurred
- `reconnected` - Database reconnected

## Configuration

The `DatabaseConfig` interface allows you to configure:

```typescript
interface DatabaseConfig {
  uri: string;                    // MongoDB connection URI
  options?: ConnectOptions;       // Mongoose connection options
}
```

Default connection options:
- `maxPoolSize: 10`
- `serverSelectionTimeoutMS: 5000`
- `socketTimeoutMS: 45000`
- `bufferCommands: false`

## Development

### Building

```bash
npm run build
```

### Watching for changes

```bash
npm run dev
```

### Cleaning build artifacts

```bash
npm run clean
```
