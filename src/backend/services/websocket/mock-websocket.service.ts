// src/backend/services/websocket/mock-websocket.service.ts
import { WebSocketService } from "./index.ts";
import { ValidationProgress, ValidationResults, ValidationError } from "../../types/validation.types.ts";
import { createLogger } from "../../../utils/logger.ts";

const logger = createLogger("mockWebSocketService");

/**
 * Mock implementation of WebSocketService
 * 
 * This implementation does nothing but log method calls, allowing us to
 * keep the backend WebSocket implementation intact while not using it in the frontend.
 */
export class MockWebSocketService implements WebSocketService {
  handleConnection(_socket: WebSocket): void {
    logger.debug("MockWebSocketService: handleConnection called (no-op)");
  }

  handleDisconnection(_clientId: string): void {
    logger.debug("MockWebSocketService: handleDisconnection called (no-op)");
  }

  broadcastProgress(_validationId: string, _progress: ValidationProgress): void {
    logger.debug("MockWebSocketService: broadcastProgress called (no-op)");
  }

  broadcastComplete(_validationId: string, _results: ValidationResults): void {
    logger.debug("MockWebSocketService: broadcastComplete called (no-op)");
  }

  broadcastError(_validationId: string, _error: ValidationError): void {
    logger.debug("MockWebSocketService: broadcastError called (no-op)");
  }
}

/**
 * Get a singleton instance of the mock WebSocket service
 */
export function getMockWebSocketService(): WebSocketService {
  return new MockWebSocketService();
}
