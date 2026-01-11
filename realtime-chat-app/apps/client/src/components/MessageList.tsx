import { useEffect, useRef } from 'react';
import { IMessage } from '@chat-app/shared';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: IMessage[];
  currentUser?: string;
}

/**
 * Message list component
 * Displays all messages and auto-scrolls to bottom
 */
export function MessageList({ messages, currentUser }: MessageListProps): JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className="message-list">
        <div className="message-list-empty">No messages yet. Start the conversation!</div>
      </div>
    );
  }

  return (
    <div className="message-list">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} currentUser={currentUser} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
