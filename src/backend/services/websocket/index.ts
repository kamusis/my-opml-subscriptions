import { ValidationProgress, ValidationResults, ValidationError } from "../../types/validation.types.ts";

/**
 * Service for handling WebSocket connections and broadcasting validation events
 */
export interface WebSocketService {
  /**
   * Handle a new WebSocket connection
   * @param socket The WebSocket connection to handle
   */
  handleConnection(socket: WebSocket): void;

  /**
   * Handle a WebSocket disconnection
   * @param clientId The ID of the client that disconnected
   */
  handleDisconnection(clientId: string): void;

  /**
   * Broadcast validation progress to subscribed clients
   * @param validationId The ID of the validation session
   * @param progress The current progress of the validation
   */
  broadcastProgress(validationId: string, progress: ValidationProgress): void;

  /**
   * Broadcast validation completion to subscribed clients
   * @param validationId The ID of the validation session
   * @param results The final results of the validation
   */
  broadcastComplete(validationId: string, results: ValidationResults): void;

  /**
   * Broadcast validation errors to subscribed clients
   * @param validationId The ID of the validation session
   * @param error The error that occurred during validation
   */
  broadcastError(validationId: string, error: ValidationError): void;
}

// Export the implementation
export { WebSocketServiceImpl } from "./websocket.impl.ts";