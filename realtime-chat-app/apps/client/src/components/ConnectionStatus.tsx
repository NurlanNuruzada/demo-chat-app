import { ConnectionStatus as ConnectionStatusType } from '../types/index.ts';
import styles from './ConnectionStatus.module.css';

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
        return 'Not Connected';
      default:
        return 'Unknown';
    }
  };

  const getStatusClass = (): string => {
    if (error) {
      return styles.error;
    }
    const statusMap: Record<ConnectionStatusType, string> = {
      connected: styles.connected,
      connecting: styles.connecting,
      reconnecting: styles.reconnecting,
      disconnected: styles.disconnected,
    };
    return statusMap[status] || '';
  };

  const getIndicatorClass = (): string => {
    if (error) {
      return styles.indicatorError;
    }
    const indicatorMap: Record<ConnectionStatusType, string> = {
      connected: styles.indicatorConnected,
      connecting: styles.indicatorConnecting,
      reconnecting: styles.indicatorReconnecting,
      disconnected: styles.indicatorDisconnected,
    };
    return indicatorMap[status] || styles.indicator;
  };

  return (
    <div className={`${styles.connectionStatus} ${getStatusClass()}`}>
      <span className={`${styles.indicator} ${getIndicatorClass()}`}></span>
      <span className={styles.text}>{getStatusText()}</span>
    </div>
  );
}
