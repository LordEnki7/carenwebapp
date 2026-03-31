import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "http";

interface ConnectedClient {
  ws: WebSocket;
  userId: string;
  deviceType: 'web' | 'mobile';
  lastPing: number;
}

interface SyncMessage {
  type: 'sync' | 'ping' | 'pong' | 'error';
  event?: string;
  data?: any;
  timestamp: number;
  userId?: string;
}

interface SyncData {
  incidents: any[];
  emergencyContacts: any[];
  emergencyAlerts: any[];
  generatedDocuments: any[];
  lastSyncTime: number;
}

export class WebSocketManager {
  private wss: WebSocketServer;
  private clients = new Map<string, ConnectedClient>();
  private pingInterval: any;

  constructor(server: Server) {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      verifyClient: (info: any) => {
        // Allow all connections for now - in production, verify auth token
        return true;
      }
    });

    this.setupWebSocketServer();
    this.startPingInterval();
  }

  private setupWebSocketServer() {
    this.wss.on('connection', (ws, request) => {
      const url = new URL(request.url!, `http://${request.headers.host}`);
      const userId = url.searchParams.get('userId') || 'anonymous';
      const deviceType = url.searchParams.get('deviceType') as 'web' | 'mobile' || 'web';

      const clientId = `${userId}-${deviceType}-${Date.now()}`;
      
      const client: ConnectedClient = {
        ws,
        userId,
        deviceType,
        lastPing: Date.now()
      };

      this.clients.set(clientId, client);
      console.log(`WebSocket client connected: ${clientId} (${deviceType})`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'sync',
        event: 'connected',
        data: { clientId, deviceType },
        timestamp: Date.now()
      });

      ws.on('message', (data) => {
        try {
          const message: SyncMessage = JSON.parse(data.toString());
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('Invalid WebSocket message:', error);
          this.sendToClient(clientId, {
            type: 'error',
            data: { message: 'Invalid message format' },
            timestamp: Date.now()
          });
        }
      });

      ws.on('close', () => {
        this.clients.delete(clientId);
        console.log(`WebSocket client disconnected: ${clientId}`);
      });

      ws.on('error', (error) => {
        console.error(`WebSocket error for ${clientId}:`, error);
        this.clients.delete(clientId);
      });
    });
  }

  private handleMessage(clientId: string, message: SyncMessage) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case 'ping':
        client.lastPing = Date.now();
        this.sendToClient(clientId, {
          type: 'pong',
          timestamp: Date.now()
        });
        break;

      case 'sync':
        // Handle sync requests - client requesting data sync
        if (message.event === 'request_sync') {
          this.handleSyncRequest(clientId, message.data);
        }
        break;

      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  private async handleSyncRequest(clientId: string, syncData: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    try {
      // For demo purposes, we'll sync based on the demo user
      // In production, use the actual authenticated user
      const userId = client.userId === 'anonymous' ? 'demo-user' : client.userId;
      
      const syncResponse: SyncData = {
        incidents: [],
        emergencyContacts: [],
        emergencyAlerts: [],
        generatedDocuments: [],
        lastSyncTime: Date.now()
      };

      // Get user's data for synchronization
      const { storage } = await import('./storage');
      
      syncResponse.incidents = await storage.getIncidents(userId);
      syncResponse.emergencyContacts = await storage.getEmergencyContacts(userId);
      syncResponse.emergencyAlerts = await storage.getEmergencyAlerts(userId);
      syncResponse.generatedDocuments = await storage.getGeneratedLegalDocuments(userId);

      this.sendToClient(clientId, {
        type: 'sync',
        event: 'data_sync',
        data: syncResponse,
        timestamp: Date.now()
      });

    } catch (error) {
      console.error('Sync request error:', error);
      this.sendToClient(clientId, {
        type: 'error',
        data: { message: 'Sync failed' },
        timestamp: Date.now()
      });
    }
  }

  private sendToClient(clientId: string, message: SyncMessage) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      client.ws.send(JSON.stringify(message));
    }
  }

  // Broadcast data change to all clients of a specific user
  public broadcastToUser(userId: string, event: string, data: any) {
    const message: SyncMessage = {
      type: 'sync',
      event,
      data,
      timestamp: Date.now(),
      userId
    };

    Array.from(this.clients.entries()).forEach(([clientId, client]) => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  // Broadcast to all connected clients
  public broadcastToAll(event: string, data: any) {
    const message: SyncMessage = {
      type: 'sync',
      event,
      data,
      timestamp: Date.now()
    };

    Array.from(this.clients.entries()).forEach(([clientId, client]) => {
      if (client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(JSON.stringify(message));
      }
    });
  }

  private startPingInterval() {
    this.pingInterval = setInterval(() => {
      const now = Date.now();
      
      Array.from(this.clients.entries()).forEach(([clientId, client]) => {
        // Remove clients that haven't responded to ping in 60 seconds
        if (now - client.lastPing > 60000) {
          console.log(`Removing stale client: ${clientId}`);
          client.ws.terminate();
          this.clients.delete(clientId);
        } else if (client.ws.readyState === WebSocket.OPEN) {
          // Send ping to active clients
          client.ws.send(JSON.stringify({
            type: 'ping',
            timestamp: now
          }));
        }
      });
    }, 30000); // Ping every 30 seconds
  }

  public getConnectedClients(): { [userId: string]: string[] } {
    const result: { [userId: string]: string[] } = {};
    
    Array.from(this.clients.entries()).forEach(([clientId, client]) => {
      if (!result[client.userId]) {
        result[client.userId] = [];
      }
      result[client.userId].push(client.deviceType);
    });
    
    return result;
  }

  public destroy() {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }
    this.wss.close();
  }
}