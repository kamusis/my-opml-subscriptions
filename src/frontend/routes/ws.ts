// src/frontend/routes/ws.ts
import { Handlers } from "$fresh/server.ts";

/**
 * WebSocket endpoint - currently disabled
 * 
 * WebSocket functionality has been replaced with KV-based polling for validation status.
 * The backend WebSocket implementation is still available for potential future use.
 */
export const handler: Handlers = {
  GET() {
    return new Response("WebSocket functionality is currently disabled. Using KV-based polling instead.", { 
      status: 410, // Gone
      headers: { "Content-Type": "text/plain" }
    });
  },
};
