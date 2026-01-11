import { Server as HTTPServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import { config } from '../config/env.js';
import { handleConnection } from './connectionHandler.js';
import { handleMessage } from './messageHandler.js';
import { handleHeartbeat } from './heartbeatHandler.js';
import { logInfo, logError } from '../utils/logger.js';

/**
 * WebSocket server implementation using Socket.IO
 * Tracks connected clients and handles WebSocket lifecycle
 */
export class WebSocketServer {
  private io: SocketIOServer;
  private connectedClients: Set<Socket>;
  private connectionCount = 0;
  private disconnectCount = 0;

  constructor(httpServer: HTTPServer) {
    // Initialize Socket.IO server
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: config.corsOrigin,
        methods: ['GET', 'POST'],
      },
    });

    this.connectedClients = new Set<Socket>();

    this.setupEventHandlers();
  }

  /**
   * Setup Socket.IO event handlers
   */
  private setupEventHandlers(): void {
    // Handle new connections
    this.io.on('connection', (socket: Socket) => {
      this.handleConnection(socket);
    });

    // Handle server errors
    this.io.engine.on('connection_error', (error: Error) => {
      this.handleError(error);
    });
  }

  /**
   * Handle new client connection
   */
  private handleConnection(socket: Socket): void {
    // Add to connected clients set
    this.connectedClients.add(socket);
    this.connectionCount++;

    // Handle connection hydration and logging
    handleConnection(socket, this.io);

    // Handle heartbeat (ping/pong)
    handleHeartbeat(socket);

    // Handle client messages (Socket.IO custom event: send_message)
    socket.on('send_message', (data: unknown) => {
      this.handleMessage(socket, data);
    });

    // Handle client disconnect
    socket.on('disconnect', (reason: string) => {
      this.handleDisconnect(socket, reason);
    });

    // Handle client errors
    socket.on('error', (error: Error) => {
      this.handleError(error);
    });
  }

  /**
   * Handle incoming message from client
   */
  private handleMessage(socket: Socket, data: unknown): void {
    // Use message handler for parse -> validate -> store -> broadcast flow
    handleMessage(socket, this.io, data);
  }

  /**
   * Handle client disconnect
   */
  private handleDisconnect(socket: Socket, reason: string): void {
    // Remove from connected clients set
    this.connectedClients.delete(socket);
    this.disconnectCount++;

    logInfo('Client disconnected', {
      socketId: socket.id,
      reason,
      totalClients: this.connectedClients.size,
      connectionCount: this.connectionCount,
      disconnectCount: this.disconnectCount,
    });
  }

  /**
   * Handle errors
   */
  private handleError(error: Error): void {
    logError('WebSocket error', {
      error: error.message,
      stack: error.stack,
    });
  }

  /**
   * Get the Socket.IO server instance
   */
  getIO(): SocketIOServer {
    return this.io;
  }

  /**
   * Get number of connected clients
   */
  getConnectedClientsCount(): number {
    return this.connectedClients.size;
  }

  /**
   * Get all connected clients
   */
  getConnectedClients(): Set<Socket> {
    return this.connectedClients;
  }

  /**
   * Close the WebSocket server
   */
  close(): void {
    this.io.close();
    this.connectedClients.clear();
  }
}
