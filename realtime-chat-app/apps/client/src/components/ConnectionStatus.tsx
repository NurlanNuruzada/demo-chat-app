import { ConnectionStatus as ConnectionStatusType } from '../types/index.ts';
import { CONNECTION_STATUS, CONNECTION_STATUS_TEXT } from '../utils/constants';
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
      case CONNECTION_STATUS.CONNECTED:
        return CONNECTION_STATUS_TEXT.CONNECTED;
      case CONNECTION_STATUS.CONNECTING:
        return CONNECTION_STATUS_TEXT.CONNECTING;
      case CONNECTION_STATUS.RECONNECTING:
        return CONNECTION_STATUS_TEXT.RECONNECTING;
      case CONNECTION_STATUS.DISCONNECTED:
        return CONNECTION_STATUS_TEXT.DISCONNECTED;
      default:
        return CONNECTION_STATUS_TEXT.UNKNOWN;
    }
  };

  const getStatusClass = (): string => {
    if (error) {
      return styles.error;
    }
    const statusMap: Record<ConnectionStatusType, string> = {
      [CONNECTION_STATUS.CONNECTED]: styles.connected,
      [CONNECTION_STATUS.CONNECTING]: styles.connecting,
      [CONNECTION_STATUS.RECONNECTING]: styles.reconnecting,
      [CONNECTION_STATUS.DISCONNECTED]: styles.disconnected,
    };
    return statusMap[status] || '';
  };

  const getIndicatorClass = (): string => {
    if (error) {
      return styles.indicatorError;
    }
    const indicatorMap: Record<ConnectionStatusType, string> = {
      [CONNECTION_STATUS.CONNECTED]: styles.indicatorConnected,
      [CONNECTION_STATUS.CONNECTING]: styles.indicatorConnecting,
      [CONNECTION_STATUS.RECONNECTING]: styles.indicatorReconnecting,
      [CONNECTION_STATUS.DISCONNECTED]: styles.indicatorDisconnected,
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
