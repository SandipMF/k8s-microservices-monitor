import { databaseManager, DatabaseConfig } from "@microservices/shared-database";
import { MONGODB_URI } from "./env.config";

const dbConfig: DatabaseConfig = {
  uri: MONGODB_URI,
};

export const connectDatabase = async (): Promise<void> => {
  try {
    await databaseManager.connect(dbConfig);
  } catch (error) {
    console.error("Failed to connect to database:", error);
    process.exit(1);
  }
};
