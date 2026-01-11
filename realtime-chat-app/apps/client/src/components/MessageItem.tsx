import { IMessage } from '@chat-app/shared';
import { formatTime, formatFullTime } from '../utils/formatTime';

interface MessageItemProps {
  message: IMessage;
}

/**
 * Individual message item component
 */
export function MessageItem({ message }: MessageItemProps): JSX.Element {
  return (
    <div className="message-item">
      <div className="message-header">
        <span className="message-user">{message.user}</span>
        <span className="message-time" title={formatFullTime(message.timestamp)}>
          {formatTime(message.timestamp)}
        </span>
      </div>
      <div className="message-content">{message.content}</div>
    </div>
  );
}
