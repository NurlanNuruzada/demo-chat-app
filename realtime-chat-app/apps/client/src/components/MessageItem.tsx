import { IMessage } from '@chat-app/shared';
import { formatTime } from '../utils/formatTime';

interface MessageItemProps {
  message: IMessage;
  currentUser?: string;
}

/**
 * Individual message component
 * Displays message content, sender, and timestamp in WhatsApp-style bubbles
 */
export function MessageItem({ message, currentUser }: MessageItemProps): JSX.Element {
  const isOwnMessage = currentUser && message.user.trim().toLowerCase() === currentUser.trim().toLowerCase();
  const itemClass = isOwnMessage ? 'message-item message-item-own' : 'message-item message-item-other';

  return (
    <div className={itemClass}>
      {!isOwnMessage && <div className="message-sender">{message.user}</div>}
      <div className="message-bubble">
        <div className="message-content">{message.content}</div>
        <div className="message-meta">
          <span className="message-timestamp">{formatTime(message.timestamp)}</span>
        </div>
      </div>
    </div>
  );
}
