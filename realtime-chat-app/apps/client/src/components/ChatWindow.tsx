import { useState, useCallback, useEffect } from 'react';
import { IMessage } from '@chat-app/shared';
import { useChatSocket } from '../hooks/useChatSocket';
import { useChatError } from '../hooks/useChatError';
import { storage } from '../utils/storage';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ChatHeader } from './ChatHeader';
import { UsernameScreen } from './UsernameScreen';
import { SearchModal } from './SearchModal';
import styles from './ChatWindow.module.css';

/**
 * Main chat window component
 * Orchestrates chat functionality with separated concerns
 */
export function ChatWindow(): JSX.Element {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [username, setUsername] = useState(() => storage.getUsername());
  const [draft, setDraft] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Error handling hook
  const {
    handleError,
    handleStatusChange,
    getConnectionError,
    getInputError,
    clearError,
  } = useChatError();

  // Save username to localStorage whenever it changes
  useEffect(() => {
    storage.setUsername(username);
  }, [username]);

  // Handle history (REPLACE messages - critical for reconnection)
  const handleHistory = useCallback((historyMessages: IMessage[]) => {
    setMessages(historyMessages);
  }, []);

  // Handle new message (append to list)
  const handleMessage = useCallback((message: IMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // WebSocket hook - only connect when username is set
  const { status, connected, sendMessage, disconnect: disconnectSocket, error: socketError } = useChatSocket({
    enabled: username.trim().length > 0,
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
  const handleUsernameSubmit = useCallback(
    (newUsername: string) => {
      setUsername(newUsername);
      setMessages([]);
      clearError();
    },
    [clearError]
  );

  // Handle logout
  const handleLogout = useCallback(() => {
    disconnectSocket();
    storage.removeUsername();
    setUsername('');
    setDraft('');
    setMessages([]);
  }, [disconnectSocket]);

  // Get computed error values
  const connectionError = getConnectionError(status, socketError);
  const inputError = getInputError();

  // Show username screen if username is not set
  // Don't render ChatWindow at all if username is not set (prevents socket connection)
  if (!username.trim()) {
    return <UsernameScreen onUsernameSubmit={handleUsernameSubmit} />;
  }

  // Show chat interface when username is set
  return (
    <div className={styles.chatWindow}>
      <ChatHeader
        username={username}
        status={status}
        connectionError={connectionError}
        onSearchClick={() => setIsSearchOpen(true)}
        onLogout={handleLogout}
      />
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
        onMessageSelect={() => {
          setIsSearchOpen(false);
          // TODO: Implement scroll-to-message functionality
        }}
      />
    </div>
  );
}
