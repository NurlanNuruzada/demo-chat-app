interface ConnectionStatusProps {
  connected: boolean;
  error?: string | null;
}

/**
 * Connection status indicator component
 */
export function ConnectionStatus({ connected, error }: ConnectionStatusProps): JSX.Element {
  if (error) {
    return (
      <div className="connection-status connection-status-error">
        <span className="connection-status-indicator connection-status-indicator-error"></span>
        <span className="connection-status-text">Error: {error}</span>
      </div>
    );
  }

  return (
    <div className={`connection-status connection-status-${connected ? 'connected' : 'disconnected'}`}>
      <span className={`connection-status-indicator connection-status-indicator-${connected ? 'connected' : 'disconnected'}`}></span>
      <span className="connection-status-text">{connected ? 'Connected' : 'Disconnected'}</span>
    </div>
  );
}
