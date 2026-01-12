import { ConnectionStatus } from '../types/index.ts';
import { ConnectionStatus as ConnectionStatusComponent } from './ConnectionStatus';
import styles from './ChatWindow.module.css';

interface ChatHeaderProps {
  username: string;
  status: ConnectionStatus;
  connectionError: string | null;
  onSearchClick: () => void;
  onLogout: () => void;
}

/**
 * Chat header component
 * Displays app title, username, connection status, and action buttons
 */
export function ChatHeader({
  username,
  status,
  connectionError,
  onSearchClick,
  onLogout,
}: ChatHeaderProps): JSX.Element {
  return (
    <div className={styles.header}>
      <div className={styles.headerLeft}>
        <h1>Fullstack Technical Challenge: Chat App</h1>
        <span className={styles.username}>{username}</span>
      </div>
      <div className={styles.headerRight}>
        <button className={styles.searchButton} onClick={onSearchClick} aria-label="Search messages">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2" />
            <path
              d="m21 21-4.35-4.35"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        <ConnectionStatusComponent status={status} error={connectionError} />
        <button className={styles.logoutButton} onClick={onLogout} aria-label="Logout">
          Logout
        </button>
      </div>
    </div>
  );
}
