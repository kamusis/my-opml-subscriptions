import { createLogger } from "../../../utils/logger.ts";
import { IKVStorageService } from "../storage/index.ts";
import { WebSocketService } from "../websocket/index.ts";
import { 
  ValidationSession,
  ValidationProgress, 
  ValidationResults,
  FeedValidationResult,
  BatchValidationResult,
  ValidationError
} from "../../types/validation.types.ts";
import { checkFeedAccessibility } from "../../checkFeedAccessibility.ts";
import { checkFeedCompatibility } from "../../checkFeedCompatibility.ts";
import { getFeedUpdateFrequency } from "../../getFeedUpdateFrequency.ts";

const logger = createLogger("validationService");

export class ValidationServiceImpl {
  constructor(
    private readonly storage: IKVStorageService,
    private readonly websocket: WebSocketService
  ) {}

  async startValidation(opmlId: string): Promise<string> {
    const validationId = crypto.randomUUID();
    const session: ValidationSession = {
      id: validationId,
      opmlId,
      status: 'pending',
      progress: {
        processedFeeds: 0,
        totalFeeds: 0,
        categoryCounts: {
          active: 0,
          inactive: 0,
          dead: 0,
          incompatible: 0
        }
      },
      startTime: new Date().toISOString()
    };

    try {
      await this.storage.saveValidationSession(validationId, session);
      return validationId;
    } catch (error) {
      logger.error(`Failed to start validation session: ${error}`);
      throw new Error('Failed to start validation session');
    }
  }

  async getValidationStatus(validationId: string): Promise<ValidationSession | null> {
    try {
      const result = await this.storage.getValidationSession(validationId);
      return result?.value ?? null;
    } catch (error) {
      logger.error(`Failed to get validation status: ${error}`);
      throw new Error('Failed to get validation status');
    }
  }

  async validateFeeds(urls: string[]): Promise<ValidationResults> {
    const validationId = crypto.randomUUID();
    const startTime = Date.now();
    const results: ValidationResults = {
      validatedFeeds: 0,
      categories: {
        active: 0,
        inactive: 0,
        dead: 0,
        incompatible: 0
      },
      duration: 0,
      errors: []
    };

    // Initialize progress
    const progress: ValidationProgress = {
      processedFeeds: 0,
      totalFeeds: urls.length,
      categoryCounts: { ...results.categories }
    };

    try {
      for (const url of urls) {
        try {
          const result = await this.validateSingleFeed(url);
          results.validatedFeeds++;
          progress.processedFeeds++;
          progress.currentFeed = url;
          
          // Update category counts
          progress.categoryCounts[result.status]++;
          results.categories[result.status]++;

          // Update progress
          await this.updateProgress(validationId, progress);
          
          if (result.error) {
            results.errors?.push({
              feedUrl: url,
              error: result.error,
              timestamp: new Date().toISOString()
            });
          }
        } catch (error) {
          logger.error(`Error validating feed ${url}:`, error);
          results.errors?.push({
            feedUrl: url,
            error: error instanceof Error ? error.message : 'Unknown error occurred',
            timestamp: new Date().toISOString()
          });
        }
      }

      results.duration = Date.now() - startTime;
      await this.completeValidation(validationId, results);
      return results;
    } catch (error) {
      logger.error('Validation process failed:', error);
      await this.handleValidationError(validationId, error);
      throw error;
    }
  }

  async revalidateFeed(url: string): Promise<FeedValidationResult> {
    try {
      return await this.validateSingleFeed(url);
    } catch (error) {
      logger.error(`Revalidation failed for feed ${url}:`, error);
      throw error;
    }
  }

  async batchValidate(urls: string[]): Promise<BatchValidationResult> {
    const validationId = crypto.randomUUID();
    const totalFeeds = urls.length;
    let processedFeeds = 0;
    const results: FeedValidationResult[] = [];
    const errors: ValidationError[] = [];

    // Create initial progress
    const progress: ValidationProgress = {
      processedFeeds: 0,
      totalFeeds,
      categoryCounts: {
        active: 0,
        inactive: 0,
        dead: 0,
        incompatible: 0
      }
    };

    try {
      // Save initial session state
      await this.storage.saveValidationSession(validationId, {
        id: validationId,
        opmlId: 'batch-validation',
        status: 'processing',
        progress,
        startTime: new Date().toISOString()
      });

      // Process feeds in batches of 10 to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < urls.length; i += batchSize) {
        const batch = urls.slice(i, i + batchSize);
        const batchResults = await Promise.all(
          batch.map(async (url) => {
            try {
              const result = await this.validateSingleFeed(url);
              processedFeeds++;
              
              // Update progress
              progress.processedFeeds = processedFeeds;
              progress.currentFeed = url;
              progress.categoryCounts[result.status]++;
              
              // Update progress in storage and broadcast
              await this.updateProgress(validationId, progress);
              
              return result;
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
              errors.push({
                feedUrl: url,
                error: errorMessage,
                timestamp: new Date().toISOString()
              });
              return {
                url,
                status: 'incompatible' as const,
                error: errorMessage
              };
            }
          })
        );

        results.push(...batchResults);
      }

      // Complete validation
      await this.completeValidation(validationId, {
        validatedFeeds: processedFeeds,
        categories: progress.categoryCounts,
        duration: 0,
        errors
      });

      return {
        totalProcessed: processedFeeds,
        results,
        errors
      };
    } catch (error) {
      logger.error('Batch validation failed:', error);
      await this.handleValidationError(validationId, error);
      throw error;
    }
  }

  private async validateSingleFeed(url: string): Promise<FeedValidationResult> {
    // First check accessibility
    const isAccessible = await checkFeedAccessibility(url);
    if (!isAccessible) {
      return {
        url,
        status: 'dead',
        error: 'Feed URL is not accessible'
      };
    }

    // Check compatibility
    const compatibilityCheck = await checkFeedCompatibility(url);
    if (compatibilityCheck.status === 'incompatible') {
      return {
        url,
        status: 'incompatible',
        error: compatibilityCheck.incompatibleReason
      };
    }

    // Check update frequency for compatible feeds
    const updateCheck = await getFeedUpdateFrequency(url);
    return {
      url,
      status: updateCheck.status,
      error: updateCheck.incompatibleReason,
      lastUpdate: updateCheck.lastUpdate?.toISOString(),
      updatesInLast3Months: updateCheck.updatesInLast3Months
    };
  }

  private async updateProgress(validationId: string, progress: ValidationProgress): Promise<void> {
    try {
      await this.storage.updateValidationProgress(validationId, progress);
      this.websocket.broadcastProgress(validationId, progress);
    } catch (error) {
      logger.error(`Failed to update progress for validation ${validationId}:`, error);
      // Don't throw - allow validation to continue even if progress updates fail
    }
  }

  private async completeValidation(validationId: string, results: ValidationResults): Promise<void> {
    try {
      // Update session status
      const session = await this.getValidationStatus(validationId);
      if (session) {
        session.status = 'completed';
        session.endTime = new Date().toISOString();
        await this.storage.saveValidationSession(validationId, session);
      }

      // Broadcast completion
      this.websocket.broadcastComplete(validationId, results);
    } catch (error) {
      logger.error(`Failed to complete validation ${validationId}:`, error);
    }
  }

  private async handleValidationError(validationId: string, error: unknown): Promise<void> {
    try {
      // Update session status
      const session = await this.getValidationStatus(validationId);
      if (session) {
        session.status = 'error';
        session.endTime = new Date().toISOString();
        session.error = error instanceof Error ? error.message : 'Unknown error occurred';
        await this.storage.saveValidationSession(validationId, session);
      }

      // Broadcast error
      this.websocket.broadcastError(validationId, {
        feedUrl: 'batch',
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        timestamp: new Date().toISOString()
      });
    } catch (err) {
      logger.error(`Failed to handle validation error for ${validationId}:`, err);
    }
  }
}