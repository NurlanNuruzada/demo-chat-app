import { IMessage } from '@chat-app/shared';

/**
 * In-memory message store
 * Maintains the last 10 messages for connection hydration
 */
class MessageStore {
  private messageHistory: IMessage[] = [];
  private readonly MAX_MESSAGES = 10;

  /**
   * Add a new message to the history
   * Automatically trims to last 10 messages
   */
  addMessage(message: IMessage): void {
    this.messageHistory.push(message);

    // Trim to last 10 messages if over limit
    if (this.messageHistory.length > this.MAX_MESSAGES) {
      this.messageHistory = this.messageHistory.slice(-this.MAX_MESSAGES);
    }
  }

  /**
   * Get the last N messages (default: last 10)
   */
  getLastMessages(count: number = this.MAX_MESSAGES): IMessage[] {
    return this.messageHistory.slice(-count);
  }

  /**
   * Get all messages
   */
  getAllMessages(): IMessage[] {
    return [...this.messageHistory];
  }

  /**
   * Get message count
   */
  getMessageCount(): number {
    return this.messageHistory.length;
  }

  /**
   * Clear all messages
   */
  clear(): void {
    this.messageHistory = [];
  }
}

// Export singleton instance
export const messageStore = new MessageStore();
