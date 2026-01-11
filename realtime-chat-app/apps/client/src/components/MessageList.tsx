import { useEffect, useRef } from 'react';
import { IMessage } from '@chat-app/shared';
import { MessageItem } from './MessageItem';

interface MessageListProps {
  messages: IMessage[];
}

/**
 * Scrollable message list component
 * Auto-scrolls to bottom when new messages arrive
 */
export function MessageList({ messages }: MessageListProps): JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="message-list">
      {messages.length === 0 ? (
        <div className="message-list-empty">No messages yet. Start the conversation!</div>
      ) : (
        messages.map((message) => <MessageItem key={message.id} message={message} />)
      )}
      <div ref={messagesEndRef} />
    </div>
  );
}
