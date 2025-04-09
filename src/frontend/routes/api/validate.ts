import { Handlers } from "$fresh/server.ts";
import { createLogger } from "../../../utils/logger.ts";
import { KVStorageService } from "../../../backend/services/storage/index.ts";
import { ValidationServiceImpl } from "../../../backend/services/validation/index.ts";
import { WebSocketServiceImpl } from "../../../backend/services/websocket/index.ts";
import type { ListFeedsOptions } from "../../../backend/types/storage.types.ts";

// Create singleton instances for services
let storageInstance: KVStorageService | null = null;
let websocketInstance: WebSocketServiceImpl | null = null;

/**
 * Get or create the storage service instance
 */
async function getStorageService(): Promise<KVStorageService> {
  if (!storageInstance) {
    storageInstance = await KVStorageService.initialize();
  }
  return storageInstance;
}

/**
 * Get or create the websocket service instance
 */
function getWebSocketService(): WebSocketServiceImpl {
  if (!websocketInstance) {
    websocketInstance = new WebSocketServiceImpl();
  }
  return websocketInstance;
}

const logger = createLogger("api:validate");

export const handler: Handlers = {
  async POST(req) {
    try {
      // Parse request body if any
      let requestBody = {};
      try {
        if (req.headers.get("content-type")?.includes("application/json")) {
          requestBody = await req.json();
        }
      } catch (error) {
        logger.warn("Failed to parse request body as JSON:", error);
      }

      // Get service instances
      const storage = await getStorageService();
      const websocketService = getWebSocketService();
      const validationService = new ValidationServiceImpl(storage, websocketService);

      // Generate a unique validation ID
      const opmlId = (requestBody as { opmlId?: string })?.opmlId || "default";
      const validationId = await validationService.startValidation(opmlId);

      // Fetch all feeds from storage
      const options: ListFeedsOptions = {
        limit: 1000, // Set a reasonable limit
      };
      const feedsResult = await storage.listFeeds(options);
      const feedUrls = feedsResult.feeds.map(feed => feed.url);

      if (feedUrls.length === 0) {
        return new Response(JSON.stringify({
          error: "No feeds found to validate"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Start validation process asynchronously
      // We don't await this to make the API non-blocking
      (async () => {
        try {
          logger.info(`Starting validation process for ${feedUrls.length} feeds`);
          
          // Start the validation process which will update progress via WebSockets
          // and return detailed results for each feed
          const results = await validationService.validateFeeds(feedUrls, validationId);
          logger.info(`Validation completed for ${results.validatedFeeds} feeds`);
          
          // Update feed records with validation results
          for (const feedResult of results.feedResults) {
            try {
              const now = new Date().toISOString();
              const feed = feedsResult.feeds.find(f => f.url === feedResult.url);
              
              if (feed) {
                // Update the feed data with validation results
                await storage.updateFeedData(feed.url, {
                  status: feedResult.status,
                  lastUpdate: feedResult.lastUpdate || feed.lastUpdate,
                  updatesInLast3Months: feedResult.updatesInLast3Months || feed.updatesInLast3Months,
                  incompatibleReason: feedResult.error || feed.incompatibleReason,
                  lastValidated: now,
                  validationHistory: [
                    ...(feed.validationHistory || []).slice(0, 9), // Keep last 10 validations
                    { timestamp: now, status: feedResult.status }
                  ]
                });
                
                logger.debug(`Updated feed data for ${feed.url}, status: ${feedResult.status}`);
              }
            } catch (error) {
              logger.error(`Failed to update feed data for ${feedResult.url}:`, error);
            }
          }
        } catch (error) {
          logger.error("Error during validation process:", error);
        }
      })();

      // Return immediate response with validation ID
      return new Response(JSON.stringify({
        validationId,
        status: "processing",
        message: "Validation process started",
        totalFeeds: feedUrls.length
      }), {
        status: 202, // Accepted
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      logger.error(`Error processing validation request: ${error}`);
      return new Response(JSON.stringify({
        error: "Internal server error while processing validation request"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  },

  // GET handler to check validation status
  async GET(req) {
    try {
      const url = new URL(req.url);
      const validationId = url.searchParams.get("id") || "";

      if (!validationId) {
        return new Response(JSON.stringify({
          error: "Validation ID is required"
        }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }

      // Get service instances
      const storage = await getStorageService();
      const websocketService = getWebSocketService();
      const validationService = new ValidationServiceImpl(storage, websocketService);

      // Get validation status
      const status = await validationService.getValidationStatus(validationId);
      
      if (!status) {
        return new Response(JSON.stringify({
          error: "Validation session not found"
        }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }

      return new Response(JSON.stringify(status), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });

    } catch (error) {
      logger.error(`Error checking validation status: ${error}`);
      return new Response(JSON.stringify({
        error: "Internal server error while checking validation status"
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
