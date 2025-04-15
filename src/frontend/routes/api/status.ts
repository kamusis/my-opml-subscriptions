import { Handlers } from "$fresh/server.ts";
import { createLogger } from "../../../utils/logger.ts";
import { extractUserIdFromRequest } from "../../../utils/user.ts";
import { KVStorageService } from "../../../backend/services/storage/index.ts";
import { ValidationServiceImpl } from "../../../backend/services/validation/index.ts";
import { WebSocketServiceImpl } from "../../../backend/services/websocket/index.ts";

// Create singleton instances for services
let storageInstance: KVStorageService | null = null;
let websocketInstance: WebSocketServiceImpl | null = null;

/**
 * Get or create the storage service instance
 */
async function get_storage_service(): Promise<KVStorageService> {
  if (!storageInstance) {
    storageInstance = await KVStorageService.initialize();
  }
  return storageInstance;
}

/**
 * Get or create the websocket service instance
 */
function get_websocket_service(): WebSocketServiceImpl {
  if (!websocketInstance) {
    websocketInstance = new WebSocketServiceImpl();
  }
  return websocketInstance;
}

const logger = createLogger("api:status");

export const handler: Handlers = {
  /**
   * GET handler to retrieve validation status
   * 
   * @param req The request object
   * @param ctx The context object
   * @returns Response with validation status or error
   */
  async GET(req) {
    try {
      // Get validation ID from URL
      const url = new URL(req.url);
      const validation_id = url.searchParams.get("id");
      
      if (!validation_id) {
        return new Response(
          JSON.stringify({ error: "Missing validation ID parameter" }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Multi-user support: extract userId from headers
      const [userId, errorResponse] = extractUserIdFromRequest(req);
      if (errorResponse) return errorResponse;
      // Get service instances
      const storage = await get_storage_service();
      const websocket_service = get_websocket_service();
      const validation_service = new ValidationServiceImpl(storage, websocket_service);

      // Get validation status
      const validation_session = await validation_service.getValidationStatus(userId!, validation_id);
      
      if (!validation_session) {
        return new Response(
          JSON.stringify({ error: "Validation session not found" }),
          { status: 404, headers: { "Content-Type": "application/json" } }
        );
      }

      // Return validation status
      return new Response(
        JSON.stringify(validation_session),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (error) {
      logger.error(`Error retrieving validation status: ${error}`);
      return new Response(
        JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  }
};
