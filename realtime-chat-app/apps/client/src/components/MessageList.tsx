import { useEffect, useRef } from 'react';
import { IMessage } from '@chat-app/shared';
import { MessageItem } from './MessageItem';
import styles from './MessageList.module.css';

interface MessageListProps {
  messages: IMessage[];
  currentUser?: string;
}

/**
 * Message list component
 * Displays all messages and auto-scrolls to bottom only if user is at bottom
 */
export function MessageList({ messages, currentUser }: MessageListProps): JSX.Element {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const isAtBottomRef = useRef(true);

  // Check if user is at bottom of scroll
  const checkIfAtBottom = (): boolean => {
    if (!listRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = listRef.current;
    // Consider "at bottom" if within 50px of bottom
    return scrollHeight - scrollTop - clientHeight < 50;
  };

  // Track scroll position
  useEffect(() => {
    const list = listRef.current;
    if (!list) return;

    const handleScroll = () => {
      isAtBottomRef.current = checkIfAtBottom();
    };

    list.addEventListener('scroll', handleScroll);
    return () => list.removeEventListener('scroll', handleScroll);
  }, []);

  // Auto-scroll to bottom when new messages arrive, but only if user is already at bottom
  useEffect(() => {
    if (isAtBottomRef.current) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    } else {
      // Update ref when messages change but don't scroll
      isAtBottomRef.current = checkIfAtBottom();
    }
  }, [messages]);

  if (messages.length === 0) {
    return (
      <div className={styles.messageList}>
        <div className={styles.empty}>No messages yet. Start the conversation!</div>
      </div>
    );
  }

  return (
    <div ref={listRef} className={styles.messageList}>
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} currentUser={currentUser} />
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
}
