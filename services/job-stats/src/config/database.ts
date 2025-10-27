import mongoose from 'mongoose';
import { MONGODB_URI } from './env.config';

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
