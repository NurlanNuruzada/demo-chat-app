import { SOCKET_CONFIG } from './constants';

/**
 * Get the default server URL for Socket.IO connection
 */
export function getDefaultServerUrl(): string {
  if (import.meta.env.VITE_SERVER_URL) {
    return import.meta.env.VITE_SERVER_URL;
  }

  if (typeof window !== 'undefined') {
    return `${window.location.protocol}//${window.location.hostname}:${SOCKET_CONFIG.DEFAULT_PORT}`;
  }

  return `http://localhost:${SOCKET_CONFIG.DEFAULT_PORT}`;
}

/**
 * Check if an error should be filtered out (technical errors)
 */
export function shouldFilterError(errorMessage: string): boolean {
  return (
    errorMessage.includes('xhr poll error') ||
    errorMessage.includes('websocket error')
  );
}
