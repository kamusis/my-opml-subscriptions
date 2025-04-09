import { createLogger } from "../../../utils/logger.ts";
import { 
  ValidationProgress, 
  ValidationResults, 
  ValidationError 
} from "../../types/validation.types.ts";
import type { WebSocketService } from "./index.ts";
import type {
  WebSocketMessage,
  SubscribeMessage,
  UnsubscribeMessage
} from "../../types/websocket.types.ts";

const logger = createLogger("websocketService");

interface WebSocketClient {
  socket: WebSocket;
  validationIds: Set<string>;
}

export class WebSocketServiceImpl implements WebSocketService {
  private clients: Map<string, WebSocketClient> = new Map();

  handleConnection(socket: WebSocket): void {
    const clientId = crypto.randomUUID();
    
    try {
      this.clients.set(clientId, {
        socket,
        validationIds: new Set()
      });

      // Set up event handlers
      socket.onclose = () => {
        this.handleDisconnection(clientId);
      };

      socket.onerror = (error) => {
        logger.error(`WebSocket error for client ${clientId}:`, error);
        this.handleDisconnection(clientId);
      };

      socket.onmessage = (event) => {
        this.handleMessage(clientId, event);
      };

      logger.info(`Client ${clientId} connected`);

      // Send initial confirmation
      this.sendToClient(clientId, {
        type: 'connected',
        clientId
      });
    } catch (error) {
      logger.error(`Failed to handle connection for client ${clientId}:`, error);
      this.handleDisconnection(clientId);
    }
  }

  handleDisconnection(clientId: string): void {
    try {
      const client = this.clients.get(clientId);
      if (client) {
        try {
          client.socket.close();
        } catch (error) {
          logger.error(`Error closing socket for client ${clientId}:`, error);
        }
        this.clients.delete(clientId);
        logger.info(`Client ${clientId} disconnected`);
      }
    } catch (error) {
      logger.error(`Error handling disconnection for client ${clientId}:`, error);
    }
  }

  broadcastProgress(validationId: string, progress: ValidationProgress): void {
    this.broadcast(validationId, {
      type: 'progress',
      validationId,
      data: progress
    });
  }

  broadcastComplete(validationId: string, results: ValidationResults): void {
    this.broadcast(validationId, {
      type: 'complete',
      validationId,
      data: results
    });
  }

  broadcastError(validationId: string, error: ValidationError): void {
    this.broadcast(validationId, {
      type: 'error',
      validationId,
      data: error
    });
  }

  private broadcast(validationId: string, message: WebSocketMessage): void {
    const payload = JSON.stringify(message);
    const deadClients: string[] = [];
    
    for (const [clientId, client] of this.clients) {
      if (client.validationIds.has(validationId)) {
        try {
          client.socket.send(payload);
        } catch (error) {
          logger.error(`Failed to send message to client ${clientId}:`, error);
          deadClients.push(clientId);
        }
      }
    }

    // Clean up dead clients after iteration
    deadClients.forEach(clientId => {
      this.handleDisconnection(clientId);
    });
  }

  private handleMessage(clientId: string, event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data) as WebSocketMessage;
      const client = this.clients.get(clientId);
      
      if (!client) {
        logger.error(`Received message for unknown client ${clientId}`);
        return;
      }

      switch (message.type) {
        case 'subscribe': {
          const subscribeMsg = message as SubscribeMessage;
          client.validationIds.add(subscribeMsg.validationId);
          this.sendToClient(clientId, {
            type: 'subscribed',
            validationId: subscribeMsg.validationId
          });
          break;
        }

        case 'unsubscribe': {
          const unsubscribeMsg = message as UnsubscribeMessage;
          client.validationIds.delete(unsubscribeMsg.validationId);
          this.sendToClient(clientId, {
            type: 'unsubscribed',
            validationId: unsubscribeMsg.validationId
          });
          break;
        }

        default:
          logger.warn(`Unknown message type received from client ${clientId}: ${message.type}`);
      }
    } catch (error) {
      logger.error(`Failed to process message from client ${clientId}:`, error);
    }
  }

  private sendToClient(clientId: string, message: WebSocketMessage): void {
    const client = this.clients.get(clientId);
    if (client) {
      try {
        client.socket.send(JSON.stringify(message));
      } catch (error) {
        logger.error(`Failed to send message to client ${clientId}:`, error);
        this.handleDisconnection(clientId);
      }
    }
  }
}