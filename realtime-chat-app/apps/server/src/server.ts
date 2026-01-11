import { createServer, Server as HTTPServer } from 'http';
import { WebSocketServer } from './websocket/WebSocketServer.js';
import { config } from './config/env.js';

/**
 * HTTP and WebSocket server lifecycle management
 */
export class Server {
  private httpServer: HTTPServer;
  private wsServer: WebSocketServer | null = null;

  constructor() {
    this.httpServer = createServer();
    this.setupGracefulShutdown();
  }

  /**
   * Start the HTTP and WebSocket servers
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        // Start HTTP server
        this.httpServer.listen(config.port, () => {
          console.log(`HTTP server listening on port ${config.port}`);
          
          // Start WebSocket server after HTTP server is ready
          this.wsServer = new WebSocketServer(this.httpServer);
          console.log('WebSocket server started');
          
          resolve();
        });

        this.httpServer.on('error', (error: Error) => {
          console.error('HTTP server error:', error);
          reject(error);
        });
      } catch (error) {
        console.error('Failed to start server:', error);
        reject(error);
      }
    });
  }

  /**
   * Get WebSocket server instance
   */
  getWebSocketServer(): WebSocketServer | null {
    return this.wsServer;
  }

  /**
   * Setup graceful shutdown handlers
   */
  private setupGracefulShutdown(): void {
    const shutdown = async (signal: string) => {
      console.log(`\n${signal} received, shutting down gracefully...`);
      
      // Close WebSocket server
      if (this.wsServer) {
        this.wsServer.close();
      }

      // Close HTTP server
      this.httpServer.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Forcefully shutting down...');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  /**
   * Stop the server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.wsServer) {
        this.wsServer.close();
      }

      this.httpServer.close(() => {
        console.log('Server stopped');
        resolve();
      });
    });
  }
}
