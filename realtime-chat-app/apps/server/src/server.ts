import { createServer, Server as HTTPServer } from 'http';
import { WebSocketServer } from './websocket/WebSocketServer.js';
import { config } from './config/env.js';
import { logInfo, logError, sanitizeError } from './utils/logger.js';

/**
 * HTTP and WebSocket server lifecycle management
 */
export class Server {
  private httpServer: HTTPServer;
  private wsServer: WebSocketServer | null = null;

  constructor() {
    this.httpServer = createServer((req, res) => {
      if (req.url === '/health') {
        res.writeHead(200, { 'Content-Type': 'text/plain' });
        res.end('OK');
        return;
      }
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not Found');
    });
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
          logInfo('HTTP server listening', { port: config.port });
          
          // Start WebSocket server after HTTP server is ready
          this.wsServer = new WebSocketServer(this.httpServer);
          logInfo('WebSocket server started');
          
          resolve();
        });

        this.httpServer.on('error', (error: Error) => {
          const isProduction = config.nodeEnv === 'production';
          const sanitized = sanitizeError(error, isProduction);
          logError('HTTP server error', {
            error: sanitized.message,
            ...(sanitized.stack && { stack: sanitized.stack }),
          });
          reject(error);
        });
      } catch (error) {
        const isProduction = config.nodeEnv === 'production';
        const sanitized = sanitizeError(error, isProduction);
        logError('Failed to start server', {
          error: sanitized.message,
          ...(sanitized.stack && { stack: sanitized.stack }),
        });
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
    const shutdown = (signal: string) => {
      logInfo(`${signal} received, shutting down gracefully`);
      
      // Close WebSocket server
      if (this.wsServer) {
        this.wsServer.close();
      }

      // Close HTTP server
      this.httpServer.close(() => {
        logInfo('HTTP server closed');
        process.exit(0);
      });

      // Force close after configured timeout
      setTimeout(() => {
        logError('Forcefully shutting down');
        process.exit(1);
      }, config.gracefulShutdownTimeout);
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
        logInfo('Server stopped');
        resolve();
      });
    });
  }
}
