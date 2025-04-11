import { createLogger } from "../../../utils/logger.ts";
import { IKVStorageService } from "../storage/index.ts";
import type { WebSocketService } from "../websocket/index.ts";
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

  async validateFeeds(urls: string[], validationId: string): Promise<ValidationResults> {
    const startTime = Date.now();
    
    try {
      // Use the validateBatchFeeds method for efficient parallel processing
      const batchResult = await this.validateBatchFeeds(urls, validationId);
      
      // Transform the batch result into the expected ValidationResults format
      const results: ValidationResults = {
        validatedFeeds: batchResult.totalProcessed,
        categories: {
          active: 0,
          inactive: 0,
          dead: 0,
          incompatible: 0
        },
        duration: Date.now() - startTime,
        errors: batchResult.errors,
        feedResults: batchResult.results
      };
      
      // Calculate category counts from feed results
      for (const result of batchResult.results) {
        results.categories[result.status]++;
      }
      
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

  private async validateBatchFeeds(urls: string[], validationId: string = crypto.randomUUID()): Promise<BatchValidationResult> {
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
              
              // Update feed record immediately after validation
              try {
                const existingFeed = await this.storage.getFeedData(url);
                const now = new Date().toISOString();
                
                if (existingFeed?.value) {
                  const feed = existingFeed.value;
                  await this.storage.updateFeedData(url, {
                    status: result.status,
                    lastUpdate: result.lastUpdate || feed.lastUpdate,
                    updatesInLast3Months: result.updatesInLast3Months || feed.updatesInLast3Months,
                    incompatibleReason: result.error || feed.incompatibleReason,
                    lastValidated: now,
                    validationHistory: [
                      ...(feed.validationHistory || []).slice(0, 9),
                      { timestamp: now, status: result.status }
                    ]
                  });
                  logger.debug(`Updated feed data for ${url}, status: ${result.status}`);
                }
              } catch (updateError) {
                logger.error(`Failed to update feed data for ${url}:`, updateError);
                // Don't throw - allow validation to continue even if feed updates fail
              }
              
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
        errors,
        feedResults: results
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
      lastUpdate: updateCheck.lastUpdate || undefined, // Convert null to undefined to match expected type
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