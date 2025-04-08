import type { ValidationProgress, ValidationResults, ValidationError } from './validation.types.ts';

/**
 * WebSocket-related types used throughout the application
 */

/**
 * Message types that can be sent/received over WebSocket
 */
export type WebSocketMessageType = 
  | 'subscribe' 
  | 'unsubscribe' 
  | 'subscribed'
  | 'unsubscribed'
  | 'connected'
  | 'progress'
  | 'complete'
  | 'error';

/**
 * Base interface for all WebSocket messages
 */
export interface WebSocketMessageBase {
  type: WebSocketMessageType;
}

/**
 * Message sent when client wants to subscribe to validation updates
 */
export interface SubscribeMessage extends WebSocketMessageBase {
  type: 'subscribe';
  validationId: string;
}

/**
 * Message sent when client wants to unsubscribe from validation updates
 */
export interface UnsubscribeMessage extends WebSocketMessageBase {
  type: 'unsubscribe';
  validationId: string;
}

/**
 * Message sent to confirm subscription
 */
export interface SubscribedMessage extends WebSocketMessageBase {
  type: 'subscribed';
  validationId: string;
}

/**
 * Message sent to confirm unsubscription
 */
export interface UnsubscribedMessage extends WebSocketMessageBase {
  type: 'unsubscribed';
  validationId: string;
}

/**
 * Message sent when client first connects
 */
export interface ConnectedMessage extends WebSocketMessageBase {
  type: 'connected';
  clientId: string;
}

/**
 * Message sent to update validation progress
 */
export interface ProgressMessage extends WebSocketMessageBase {
  type: 'progress';
  validationId: string;
  data: ValidationProgress;
}

/**
 * Message sent when validation completes
 */
export interface CompleteMessage extends WebSocketMessageBase {
  type: 'complete';
  validationId: string;
  data: ValidationResults;
}

/**
 * Message sent when validation encounters an error
 */
export interface ErrorMessage extends WebSocketMessageBase {
  type: 'error';
  validationId: string;
  data: ValidationError;
}

/**
 * Union type of all possible WebSocket messages
 */
export type WebSocketMessage =
  | SubscribeMessage
  | UnsubscribeMessage
  | SubscribedMessage
  | UnsubscribedMessage
  | ConnectedMessage
  | ProgressMessage
  | CompleteMessage
  | ErrorMessage;