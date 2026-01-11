import { Server } from './server.js';

/**
 * Server entry point
 * Starts the HTTP and WebSocket servers
 */
async function main(): Promise<void> {
  const server = new Server();

  try {
    await server.start();
    console.log('Server is running and ready to accept connections');
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch((error) => {
  console.error('Unhandled error:', error);
  process.exit(1);
});
