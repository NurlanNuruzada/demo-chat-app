/**
 * Core message interface used across the application
 * Ensures type safety between client and server
 */
export interface IMessage {
  id: string;
  user: string;
  content: string;
  timestamp: number;
}
