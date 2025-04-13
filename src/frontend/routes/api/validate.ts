import { Handlers } from "$fresh/server.ts";
import { createLogger } from "../../../utils/logger.ts";
import { KVStorageService } from "../../../backend/services/storage/index.ts";
import { ValidationServiceImpl } from "../../../backend/services/validation/index.ts";
import { getMockWebSocketService } from "../../../backend/services/websocket/mock-websocket.service.ts";
import type { ListFeedsOptions } from "../../../backend/types/storage.types.ts";

/**
 * Get or create the storage service instance
 * TODO: Refactor to use shared instance from service_instances.ts if uncommented there
 */
async function getStorageService(): Promise<KVStorageService> {
  return await KVStorageService.initialize(); // Assuming fresh instance per request for now
}

const logger = createLogger("api:validate");

export const handler: Handlers = {
  async POST(req) {
    try {
      // Parse request body if any
      let requestBody: { opmlId?: string; feedUrls?: string[] } = {};
      try {
        if (req.headers.get("content-type")?.includes("application/json")) {
          requestBody = await req.json();
        }
      } catch (error) {
        logger.warn("Failed to parse request body as JSON:", error);
      }

      // Get service instances
      const storage = await getStorageService();
      const mockWebSocketService = getMockWebSocketService();
      const validationService = new ValidationServiceImpl(storage, mockWebSocketService);

      // Generate a unique validation ID
      const opmlId = requestBody.opmlId || "default";
      const validationId = await validationService.startValidation(opmlId);

      // Determine which feeds to validate
      let feedUrls: string[] = [];

      // If specific feed URLs were provided in the request, use those
      if (requestBody.feedUrls && Array.isArray(requestBody.feedUrls) && requestBody.feedUrls.length > 0) {
        feedUrls = requestBody.feedUrls;
        logger.info(`Validating ${feedUrls.length} selected feeds`);
      } else {
        // Otherwise, fetch all feeds from storage
        const options: ListFeedsOptions = {
          limit: 1000, // Set a reasonable limit
        };
        const feedsResult = await storage.listFeeds(options);
        feedUrls = feedsResult.feeds.map(feed => feed.url);
        logger.info(`Validating all ${feedUrls.length} feeds`);
      }

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

          // Start the validation process which will update progress via KV storage
          // and return detailed results for each feed
          // Feed records are now updated during individual validation in validateBatchFeeds
          const results = await validationService.validateFeeds(feedUrls, validationId);
          logger.info(`Validation completed for ${results.validatedFeeds} feeds`);
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
      const mockWebSocketService = getMockWebSocketService();
      const validationService = new ValidationServiceImpl(storage, mockWebSocketService);

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
