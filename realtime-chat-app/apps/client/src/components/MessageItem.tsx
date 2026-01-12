import { IMessage } from '@chat-app/shared';
import { formatTime, formatFullTime } from '../utils/formatTime';
import styles from './MessageItem.module.css';

interface MessageItemProps {
  message: IMessage;
  currentUser?: string;
}

/**
 * Check if message belongs to current user
 */
function isOwnMessage(message: IMessage, currentUser?: string): boolean {
  if (!currentUser) return false;
  return message.user.trim().toLowerCase() === currentUser.trim().toLowerCase();
}

/**
 * Individual message component
 * Displays message content, sender, and timestamp in WhatsApp-style bubbles
 */
export function MessageItem({ message, currentUser }: MessageItemProps): JSX.Element {
  const own = isOwnMessage(message, currentUser);
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
}
