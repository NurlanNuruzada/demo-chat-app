import { useState, useCallback, useEffect } from 'react';
import { IMessage, IErrorMessage } from '@chat-app/shared';
import { useChatSocket } from '../hooks/useChatSocket';
import { ConnectionStatus as ConnectionStatusType } from '../types/index.js';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConnectionStatus } from './ConnectionStatus';
import { UsernameScreen } from './UsernameScreen';

const USERNAME_STORAGE_KEY = 'chat-app-username';

/**
 * Main chat window component
 * Manages state and WebSocket connection
 */
export function ChatWindow(): JSX.Element {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [username, setUsername] = useState(() => {
    // Load username from localStorage on initial render
    return localStorage.getItem(USERNAME_STORAGE_KEY) || '';
  });
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Save username to localStorage whenever it changes
  useEffect(() => {
    if (username.trim()) {
      localStorage.setItem(USERNAME_STORAGE_KEY, username.trim());
    } else {
      localStorage.removeItem(USERNAME_STORAGE_KEY);
    }
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
  const handleError = useCallback((errorMessage: IErrorMessage) => {
    setError(errorMessage.message || 'An error occurred');
    // Clear error after 5 seconds
    setTimeout(() => setError(null), 5000);
  }, []);

  // Handle status change
  const handleStatusChange = useCallback((status: ConnectionStatusType) => {
    // Clear error when connected
    if (status === 'connected') {
      setError(null);
    } else if (status === 'reconnecting') {
      setError('Connection lost. Reconnecting...');
    } else if (status === 'disconnected') {
      setError('Disconnected from server');
    }
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
    // Disconnect socket first
    disconnectSocket();
    // Clear localStorage
    localStorage.removeItem(USERNAME_STORAGE_KEY);
    // Clear username (this will show UsernameScreen)
    setUsername('');
    // Clear draft
    setDraft('');
    // Clear messages - they'll be reloaded from server on reconnect
    setMessages([]);
  }, [disconnectSocket]);

  // Display error from socket or local state
  const displayError = socketError?.message || error;

  // Show username screen if username is not set
  // Don't render ChatWindow at all if username is not set (prevents socket connection)
  if (!username.trim()) {
    return <UsernameScreen onUsernameSubmit={handleUsernameSubmit} />;
  }

  // Show chat interface when username is set
  // useChatSocket will connect automatically when this component renders
  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="chat-window-header-left">
          <h1>Chat App</h1>
          <span className="chat-window-username">{username}</span>
        </div>
        <div className="chat-window-header-right">
          <ConnectionStatus status={status} error={displayError} />
          <button className="logout-button" onClick={handleLogout} aria-label="Logout">
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
        error={displayError}
      />
    </div>
  );
}
