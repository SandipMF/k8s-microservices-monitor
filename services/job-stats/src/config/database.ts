import mongoose from 'mongoose';

// MongoDB connection URI from environment variables or default
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://mongodb-service:27017/jobs_db';

// Function to connect to MongoDB
export const connectDatabase = async (): Promise<void> => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};
