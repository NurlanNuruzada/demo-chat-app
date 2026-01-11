import { ConnectionStatus as ConnectionStatusType } from '../types/index.js';

interface ConnectionStatusProps {
  status: ConnectionStatusType;
  error?: string | null;
}

/**
 * Connection status indicator component
 * Shows current connection state with visual feedback
 */
export function ConnectionStatus({ status, error }: ConnectionStatusProps): JSX.Element {
  const getStatusText = (): string => {
    if (error) {
      return `Error: ${error}`;
    }
    switch (status) {
      case 'connected':
        return 'Connected';
      case 'connecting':
        return 'Connecting...';
      case 'reconnecting':
        return 'Reconnecting...';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = (): string => {
    if (error) {
      return 'connection-status-error';
    }
    return `connection-status-${status}`;
  };

  const getIndicatorClass = (): string => {
    if (error) {
      return 'connection-status-indicator-error';
    }
    return `connection-status-indicator-${status}`;
  };

  return (
    <div className={`connection-status ${getStatusClass()}`}>
      <span className={`connection-status-indicator ${getIndicatorClass()}`}></span>
      <span className="connection-status-text">{getStatusText()}</span>
    </div>
  );
}
