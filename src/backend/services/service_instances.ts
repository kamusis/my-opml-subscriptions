// src/backend/services/service_instances.ts
import { WebSocketServiceImpl } from "./websocket/index.ts";
// Import KVStorageService if you want to manage its instance here too
// import { KVStorageService } from "./storage/index.ts";
import { createLogger } from "../../utils/logger.ts";

const logger = createLogger("service-instances");

// --- WebSocket Service Singleton ---
let websocketInstance: WebSocketServiceImpl | null = null;

export function getWebSocketServiceInstance(): WebSocketServiceImpl {
  if (!websocketInstance) {
    logger.info("Initializing WebSocketService singleton.");
    websocketInstance = new WebSocketServiceImpl();
  }
  // logger.debug("Returning existing WebSocketService singleton."); // Optional: uncomment for debugging
  return websocketInstance;
}

// --- Storage Service Singleton (Example) ---
/*
let storageInstance: KVStorageService | null = null;

export async function getStorageServiceInstance(): Promise<KVStorageService> {
  if (!storageInstance) {
    logger.info("Initializing KVStorageService singleton.");
    storageInstance = await KVStorageService.initialize();
  }
  // logger.debug("Returning existing KVStorageService singleton."); // Optional: uncomment for debugging
  return storageInstance;
}
*/
