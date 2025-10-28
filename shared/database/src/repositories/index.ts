import { IJobRepository } from "./IJobRepository";
import { MongoDBJobRepository } from "./MongoDBJobRepository";

/**
 * Repository Factory
 * Provides a way to get the appropriate repository implementation
 * This allows easy swapping of implementations (e.g., MongoDB, PostgreSQL, etc.)
 */
class RepositoryFactory {
  private static jobRepository: IJobRepository;

  /**
   * Get the job repository instance (singleton)
   */
  public static getJobRepository(): IJobRepository {
    if (!this.jobRepository) {
      this.jobRepository = new MongoDBJobRepository();
    }
    return this.jobRepository;
  }

  /**
   * Set a custom repository implementation (useful for testing)
   */
  public static setJobRepository(repository: IJobRepository): void {
    this.jobRepository = repository;
  }

  /**
   * Reset the repository (useful for testing)
   */
  public static resetJobRepository(): void {
    this.jobRepository = new MongoDBJobRepository();
  }
}

// Export singleton instance
export const jobRepository = RepositoryFactory.getJobRepository();

// Export factory and types
export { RepositoryFactory, IJobRepository, MongoDBJobRepository };
export type {
  CreateJobData,
  UpdateJobData,
  JobQueryFilters,
  PaginationOptions,
} from "./IJobRepository";
