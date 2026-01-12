import { useState, useCallback, useEffect } from 'react';
import { IMessage, IErrorMessage } from '@chat-app/shared';
import { useChatSocket } from '../hooks/useChatSocket';
import { useErrorTimeout } from '../hooks/useErrorTimeout';
import { ConnectionStatus as ConnectionStatusType } from '../types/index.ts';
import { storage } from '../utils/storage';
import { isValidationError } from '../utils/errorHelpers';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConnectionStatus } from './ConnectionStatus';
import { UsernameScreen } from './UsernameScreen';
import { SearchModal } from './SearchModal';
import styles from './ChatWindow.module.css';

/**
 * Main chat window component
 * Manages state and WebSocket connection
 */
export function ChatWindow(): JSX.Element {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [username, setUsername] = useState(() => storage.getUsername());
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const { setErrorTimeout, clearErrorTimeout } = useErrorTimeout();

  // Save username to localStorage whenever it changes
  useEffect(() => {
    storage.setUsername(username);
  }, [username]);

  // Handle history (REPLACE messages - critical for reconnection)
  const handleHistory = useCallback((historyMessages: IMessage[]) => {
    // Overwrite, don't append - prevents duplicates on reconnect
    setMessages(historyMessages);
  }, []);

  // Handle new message (append to list)
  const handleMessage = useCallback((message: IMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Handle error
  const handleError = useCallback(
    (errorMessage: IErrorMessage) => {
      clearErrorTimeout();
      const errorText = errorMessage.message || 'An error occurred';
      setError(errorText);

      // Set timeout to clear error
      setErrorTimeout(() => {
        setError((currentError) => {
          // Only clear if it's still the same error (prevents race conditions)
          if (currentError === errorText) {
            return null;
          }
          return currentError;
        });
      }, errorMessage.code);
    },
    [setErrorTimeout, clearErrorTimeout]
  );

  // Handle status change
  const handleStatusChange = useCallback((status: ConnectionStatusType) => {
    setError((currentError) => {
      // Don't overwrite validation errors
      if (currentError && isValidationError(currentError)) {
        return currentError;
      }

      // Set appropriate error message based on status
      switch (status) {
        case 'connected':
          return null;
        case 'reconnecting':
          return 'Connection lost. Reconnecting...';
        case 'disconnected':
          return 'Disconnected from server';
        default:
          return currentError;
      }
    });
  }, []);

  // WebSocket hook - only connect when username is set
  const { status, connected, sendMessage, disconnect: disconnectSocket, error: socketError } = useChatSocket({
    enabled: username.trim().length > 0, // Only connect when username is set
    onHistory: handleHistory,
    onMessage: handleMessage,
    onError: handleError,
    onStatusChange: handleStatusChange,
  });

  // Handle send message
  const handleSend = useCallback(
    (user: string, content: string) => {
      sendMessage(user, content);
      setDraft('');
    },
    [sendMessage]
  );

  // Handle username submit
  const handleUsernameSubmit = useCallback((newUsername: string) => {
    setUsername(newUsername);
    // Clear messages - they'll be reloaded from server
    setMessages([]);
    // Clear any previous errors
    setError(null);
  }, []);

  // Handle logout
  const handleLogout = useCallback(() => {
    disconnectSocket();
    storage.removeUsername();
    setUsername('');
    setDraft('');
    setMessages([]);
  }, [disconnectSocket]);

  // Display error from socket or local state (but not when connected)
  // Validation errors (CONTENT_TOO_LONG) should only show in ChatInput, not ConnectionStatus
  const connectionError =
    status === 'connected'
      ? null
      : (socketError?.message && !isValidationError(socketError.message)
          ? socketError.message
          : error && !isValidationError(error)
            ? error
            : null);
  const inputError = error; // Show all errors in input, including validation errors

  // Show username screen if username is not set
  // Don't render ChatWindow at all if username is not set (prevents socket connection)
  if (!username.trim()) {
    return <UsernameScreen onUsernameSubmit={handleUsernameSubmit} />;
  }

  // Show chat interface when username is set
  // useChatSocket will connect automatically when this component renders
  return (
    <div className={styles.chatWindow}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <h1>Fullstack Technical Challenge: Chat App</h1>
          <span className={styles.username}>{username}</span>
        </div>
        <div className={styles.headerRight}>
          <button className={styles.searchButton} onClick={() => setIsSearchOpen(true)} aria-label="Search messages">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <ConnectionStatus status={status} error={connectionError} />
          <button className={styles.logoutButton} onClick={handleLogout} aria-label="Logout">
            Logout
          </button>
        </div>
      </div>
      <MessageList messages={messages} currentUser={username} />
      <ChatInput
        username={username}
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        disabled={!connected}
        error={inputError}
      />
      <SearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        messages={messages}
        onMessageSelect={(_messageId) => {
          setIsSearchOpen(false);
        }}
      />
    </div>
  );
}
