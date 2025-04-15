import { 
  ValidationSession,
  ValidationResults,
  FeedValidationResult,
  BatchValidationResult 
} from "../../types/validation.types.ts";

/**
 * Service for managing feed validation operations
 */
export interface ValidationService {
  /**
   * Starts a new validation session
   * @param opmlId The ID of the OPML file being validated
   * @returns The ID of the validation session
   */
  startValidation(opmlId: string): Promise<string>;

  /**
   * Gets the current status of a validation session
   * @param validationId The ID of the validation session
   * @returns The validation session details or null if not found
   */
  getValidationStatus(validationId: string): Promise<ValidationSession | null>;

  /**
   * Validates a list of feed URLs for a specific user
   * @param userId The user ID
   * @param feeds Array of feed URLs to validate
   * @returns Results of the validation process
   */
  validateFeeds(userId: string, feeds: string[]): Promise<ValidationResults>;

  /**
   * Re-validates a single feed
   * @param url The URL of the feed to re-validate
   * @returns Result of the feed validation
   */
  revalidateFeed(url: string): Promise<FeedValidationResult>;

  /**
   * Performs batch validation of multiple feeds with progress tracking for a specific user
   * @param userId The user ID
   * @param urls Array of feed URLs to validate
   * @returns Results of the batch validation process
   */
  batchValidate(userId: string, urls: string[]): Promise<BatchValidationResult>;
}

// Re-export the implementation
export * from "./validation.impl.ts";