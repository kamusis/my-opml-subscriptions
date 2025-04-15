// src/frontend/routes/api/feeds.ts
import { Handlers } from "$fresh/server.ts";
import { createLogger } from "../../../utils/logger.ts";
import { extractUserIdFromRequest } from "../../utils/user.ts";
import { KVStorageService } from "../../../backend/services/storage/index.ts";
import type { ListFeedsOptions, ListFeedsResult } from "../../../backend/types/storage.types.ts";
import type { FeedStatus } from "../../../backend/types/feed.types.ts";

// Reuse storage service singleton
let storageInstance: KVStorageService | null = null;

/**
 * Get or create the storage service instance
 */
async function getStorageService(): Promise<KVStorageService> {
  if (!storageInstance) {
    storageInstance = await KVStorageService.initialize();
  }
  return storageInstance;
}

const logger = createLogger("api:feeds");

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      
      // Parse query parameters
      const options: ListFeedsOptions = {
        limit: parseInt(url.searchParams.get("limit") || "20"),
        cursor: url.searchParams.get("cursor") || undefined,
        filter: url.searchParams.get("filter") || undefined,
        category: url.searchParams.get("category") || undefined,
        sort: url.searchParams.get("sort") as ListFeedsOptions["sort"] || undefined,
      };
      
      // Handle status filter with type safety
      const status = url.searchParams.get("status");
      if (status && ["active", "inactive", "dead", "incompatible"].includes(status)) {
        options.status = status as FeedStatus;
      }
      
      // Extract userId from headers (multi-user support)
      const [userId, errorResponse] = extractUserIdFromRequest(req);
      if (errorResponse) return errorResponse;
      // Get storage service and fetch feeds for this user
      const storage = await getStorageService();
      const result: ListFeedsResult = await storage.listFeeds(
        userId!, // non-null assertion
        options
      );
      
      // Return JSON response
      return new Response(JSON.stringify(result), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      logger.error("Error fetching feeds:", error);
      
      return new Response(JSON.stringify({
        error: "Failed to fetch feeds",
        message: error instanceof Error ? error.message : String(error)
      }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};