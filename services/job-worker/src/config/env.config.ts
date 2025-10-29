import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface EnvConfig {
  PORT: number;
  MONGODB_URI: string;
  REDIS_HOST: string;
  REDIS_PORT: number;
  NODE_ENV: string;
}

class EnvConfigValidator {
  private config: EnvConfig;

  constructor() {
    this.config = this.validateAndParseEnv();
  }

  private validateAndParseEnv(): EnvConfig {
    const errors: string[] = [];

    // Validate PORT
    const port = process.env.PORT;
    if (!port) {
      errors.push('PORT environment variable is required');
    } else if (isNaN(Number(port)) || Number(port) < 1 || Number(port) > 65535) {
      errors.push('PORT must be a valid number between 1 and 65535');
    }

    // Validate MONGODB_URI
    const mongodbUri = process.env.MONGODB_URI;
    if (!mongodbUri) {
      errors.push('MONGODB_URI environment variable is required');
    } else if (!mongodbUri.startsWith('mongodb://') && !mongodbUri.startsWith('mongodb+srv://')) {
      errors.push('MONGODB_URI must be a valid MongoDB connection string');
    }

    // Validate REDIS_HOST
    const redisHost = process.env.REDIS_HOST;
    if (!redisHost) {
      errors.push('REDIS_HOST environment variable is required');
    }

    // Validate REDIS_PORT
    const redisPort = process.env.REDIS_PORT;
    if (!redisPort) {
      errors.push('REDIS_PORT environment variable is required');
    } else if (isNaN(Number(redisPort)) || Number(redisPort) < 1 || Number(redisPort) > 65535) {
      errors.push('REDIS_PORT must be a valid number between 1 and 65535');
    }

    // Validate NODE_ENV
    const nodeEnv = process.env.NODE_ENV;
    if (!nodeEnv) {
      errors.push('NODE_ENV environment variable is required');
    } else if (!['development', 'production', 'test'].includes(nodeEnv)) {
      errors.push('NODE_ENV must be one of: development, production, test');
    }

    // If there are validation errors, log them and exit
    if (errors.length > 0) {
      console.error('❌ Environment validation failed:');
      errors.forEach(error => console.error(`  - ${error}`));
      console.error('\n💡 Please check your .env file and ensure all required environment variables are set correctly.');
      process.exit(1);
    }

    // Return validated configuration
    return {
      PORT: Number(port),
      MONGODB_URI: mongodbUri!,
      REDIS_HOST: redisHost!,
      REDIS_PORT: Number(redisPort),
      NODE_ENV: nodeEnv!
    };
  }

  public getConfig(): EnvConfig {
    return this.config;
  }

  public isDevelopment(): boolean {
    return this.config.NODE_ENV === 'development';
  }

  public isProduction(): boolean {
    return this.config.NODE_ENV === 'production';
  }

  public isTest(): boolean {
    return this.config.NODE_ENV === 'test';
  }
}

// Create and export singleton instance
const envConfig = new EnvConfigValidator();
export default envConfig;

// Export individual config values for convenience
export const config = envConfig.getConfig();
export const { PORT, MONGODB_URI, REDIS_HOST, REDIS_PORT, NODE_ENV } = config;
