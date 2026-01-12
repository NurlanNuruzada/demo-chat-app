import { IMessage } from '@chat-app/shared';
import { mkdirSync, existsSync } from 'fs';
import { writeFile, readFile } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { logError, sanitizeError } from '../utils/logger.js';
import { config } from '../config/env.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_DIR = join(__dirname, '../../data');
const STORAGE_FILE = join(STORAGE_DIR, 'messages.json');

/**
 * Validate that an object is a valid IMessage
 */
function isValidMessage(obj: unknown): obj is IMessage {
  if (!obj || typeof obj !== 'object') {
    return false;
  }
  const message = obj as Record<string, unknown>;
  return (
    typeof message.id === 'string' &&
    typeof message.user === 'string' &&
    typeof message.content === 'string' &&
    typeof message.timestamp === 'number' &&
    message.timestamp > 0
  );
}

/**
 * Simple debounce utility
 */
function debounce<T extends (...args: unknown[]) => void>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}

class MessageStore {
  private messages: IMessage[] = [];
  private initialized = false;
  private saveDebounced: () => void;

  constructor() {
    // Defer initialization to avoid blocking I/O during module load
    // Messages will be loaded on first access
    
    // Setup debounced save function (100ms delay)
    this.saveDebounced = debounce(async () => {
      await this.saveMessagesAsync();
    }, 100);
  }

  /**
   * Ensure storage directory exists (lazy initialization)
   */
  private ensureStorageDir(): void {
    try {
      if (!existsSync(STORAGE_DIR)) {
        mkdirSync(STORAGE_DIR, { recursive: true });
      }
    } catch (error) {
      const isProduction = config.nodeEnv === 'production';
      const sanitized = sanitizeError(error, isProduction);
      logError('Failed to create storage directory', {
        error: sanitized.message,
        ...(sanitized.stack && { stack: sanitized.stack }),
      });
    }
  }

  /**
   * Load messages from file storage (lazy initialization)
   */
  private async loadMessages(): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      this.ensureStorageDir();

      if (existsSync(STORAGE_FILE)) {
        const data = await readFile(STORAGE_FILE, config.fileEncoding as BufferEncoding);
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed) && parsed.every(isValidMessage)) {
          this.messages = parsed;
        } else {
          logError('Invalid message data in storage file', {
            validCount: Array.isArray(parsed) ? parsed.filter(isValidMessage).length : 0,
            totalCount: Array.isArray(parsed) ? parsed.length : 0,
          });
          this.messages = [];
        }
      }
      this.initialized = true;
    } catch (error) {
      const isProduction = config.nodeEnv === 'production';
      const sanitized = sanitizeError(error, isProduction);
      logError('Failed to load messages from storage', {
        error: sanitized.message,
        ...(sanitized.stack && { stack: sanitized.stack }),
      });
      this.messages = [];
      this.initialized = true; // Mark as initialized even on error to prevent retry loops
    }
  }

  /**
   * Save messages to file storage (async)
   */
  private async saveMessagesAsync(): Promise<void> {
    try {
      this.ensureStorageDir();
      await writeFile(STORAGE_FILE, JSON.stringify(this.messages, null, 2), config.fileEncoding as BufferEncoding);
    } catch (error) {
      const isProduction = config.nodeEnv === 'production';
      const sanitized = sanitizeError(error, isProduction);
      logError('Failed to save messages to storage', {
        error: sanitized.message,
        ...(sanitized.stack && { stack: sanitized.stack }),
      });
    }
  }

  /**
   * Add a message to the store (keeps last N messages based on config)
   */
  async addMessage(message: IMessage): Promise<void> {
    await this.loadMessages(); // Lazy initialization
    this.messages.push(message);
    
    // Keep only the last MAX_MESSAGES (efficiently remove from front)
    while (this.messages.length > config.maxMessages) {
      this.messages.shift();
    }
    
    // Debounced async save (non-blocking)
    this.saveDebounced();
  }

  /**
   * Get the last N messages
   */
  async getLastMessages(count: number): Promise<IMessage[]> {
    await this.loadMessages(); // Lazy initialization
    return this.messages.slice(-count);
  }

  /**
   * Get all messages
   */
  async getAllMessages(): Promise<IMessage[]> {
    await this.loadMessages(); // Lazy initialization
    return [...this.messages];
  }

  /**
   * Get message count
   */
  async getMessageCount(): Promise<number> {
    await this.loadMessages(); // Lazy initialization
    return this.messages.length;
  }

  /**
   * Clear all messages
   */
  async clear(): Promise<void> {
    this.messages = [];
    await this.saveMessagesAsync();
  }
}

export const messageStore = new MessageStore();
