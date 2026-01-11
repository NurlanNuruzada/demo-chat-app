import { IMessage } from '@chat-app/shared';
import { formatTime, formatFullTime } from '../utils/formatTime';

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
  const itemClass = own ? 'message-item message-item-own' : 'message-item message-item-other';

  return (
    <div className={itemClass}>
      {!own && <div className="message-sender">{message.user}</div>}
      <div className="message-bubble">
        <div className="message-content">{message.content}</div>
        <div className="message-meta">
          <span className="message-timestamp" title={formatFullTime(message.timestamp)}>
            {formatTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
}
