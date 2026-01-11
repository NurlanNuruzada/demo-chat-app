import { IMessage } from '@chat-app/shared';
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const STORAGE_DIR = join(__dirname, '../../data');
const STORAGE_FILE = join(STORAGE_DIR, 'messages.json');
const MAX_MESSAGES = 10;
const ENCODING = 'utf-8' as const;

class MessageStore {
  private messages: IMessage[] = [];

  constructor() {
    this.loadMessages();
  }

  /**
   * Load messages from file storage
   */
  private loadMessages(): void {
    try {
      // Ensure data directory exists
      mkdirSync(STORAGE_DIR, { recursive: true });

      if (existsSync(STORAGE_FILE)) {
        const data = readFileSync(STORAGE_FILE, ENCODING);
        const parsed = JSON.parse(data);
        if (Array.isArray(parsed)) {
          this.messages = parsed;
        }
      }
    } catch (error) {
      console.error('Failed to load messages from storage:', error);
      this.messages = [];
    }
  }

  /**
   * Save messages to file storage
   */
  private saveMessages(): void {
    try {
      mkdirSync(STORAGE_DIR, { recursive: true });
      writeFileSync(STORAGE_FILE, JSON.stringify(this.messages, null, 2), ENCODING);
    } catch (error) {
      console.error('Failed to save messages to storage:', error);
    }
  }

  /**
   * Add a message to the store (keeps last 10 messages)
   */
  addMessage(message: IMessage): void {
    this.messages.push(message);
    
    // Keep only the last MAX_MESSAGES
    if (this.messages.length > MAX_MESSAGES) {
      this.messages = this.messages.slice(-MAX_MESSAGES);
    }
    
    this.saveMessages();
  }

  /**
   * Get the last N messages
   */
  getLastMessages(count: number): IMessage[] {
    return this.messages.slice(-count);
  }

  /**
   * Get all messages
   */
  getAllMessages(): IMessage[] {
    return [...this.messages];
  }

  /**
   * Get message count
   */
  getMessageCount(): number {
    return this.messages.length;
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messages = [];
    this.saveMessages();
  }
}

export const messageStore = new MessageStore();
