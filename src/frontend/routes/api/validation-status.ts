// src/frontend/routes/api/validation-status.ts
import { Handlers } from "$fresh/server.ts";
import { createLogger } from "../../../utils/logger.ts";
import { extractUserIdFromRequest } from "../../utils/user.ts";
import { KVStorageService } from "../../../backend/services/storage/index.ts";
import { ValidationServiceImpl } from "../../../backend/services/validation/index.ts";
import { getMockWebSocketService } from "../../../backend/services/websocket/mock-websocket.service.ts";

const logger = createLogger("api:validation-status");

/**
 * Get or create the storage service instance
 */
async function getStorageService(): Promise<KVStorageService> {
  return await KVStorageService.initialize();
}

export const handler: Handlers = {
  async GET(req) {
    // Multi-user support: extract userId from headers
    const [userId, errorResponse] = extractUserIdFromRequest(req);
    if (errorResponse) return errorResponse;

    try {
      // Get validation ID from URL
      const url = new URL(req.url);
      const validationId = url.searchParams.get("validationId");
      
      if (!validationId) {
        return new Response(JSON.stringify({ error: "Missing validationId parameter" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Get service instances
      const storage = await getStorageService();
      // Using a mock WebSocket service as we're not using WebSockets in the frontend
      const mockWebSocketService = getMockWebSocketService();
      const validationService = new ValidationServiceImpl(storage, mockWebSocketService);
      
      // Get validation status
      const session = await validationService.getValidationStatus(userId!, validationId);
      
      if (!session) {
        return new Response(JSON.stringify({ error: "Validation session not found" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
      
      // Return the validation status
      return new Response(JSON.stringify(session), {
        headers: { "Content-Type": "application/json" }
      });
    } catch (error) {
      logger.error("Error getting validation status:", error);
      return new Response(JSON.stringify({ error: "Failed to get validation status" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
};
