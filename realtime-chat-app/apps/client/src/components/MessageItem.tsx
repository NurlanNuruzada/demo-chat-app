import React, { useMemo } from 'react';
import { IMessage } from '@chat-app/shared';
import { formatTime, formatFullTime } from '../utils/formatTime';
import styles from './MessageItem.module.css';

interface MessageItemProps {
  message: IMessage;
  currentUser?: string;
}

/**
 * Check if message belongs to current user
 * Note: Uses case-insensitive comparison by design to handle username variations
 * (e.g., "John" and "john" are treated as the same user)
 */
function isOwnMessage(message: IMessage, currentUser?: string): boolean {
  if (!currentUser) return false;
  return message.user.trim().toLowerCase() === currentUser.trim().toLowerCase();
}

/**
 * Individual message component
 * Displays message content, sender, and timestamp in WhatsApp-style bubbles
 */
export const MessageItem = React.memo(function MessageItem({ message, currentUser }: MessageItemProps) {
  const own = useMemo(() => isOwnMessage(message, currentUser), [message.user, currentUser]);
  const itemClass = own ? `${styles.messageItem} ${styles.own}` : `${styles.messageItem} ${styles.other}`;

  return (
    <div className={itemClass}>
      {!own && <div className={styles.sender}>{message.user}</div>}
      <div className={styles.bubble}>
        <div className={styles.content}>{message.content}</div>
        <div className={styles.meta}>
          <span className={styles.timestamp} title={formatFullTime(message.timestamp)}>
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
});
