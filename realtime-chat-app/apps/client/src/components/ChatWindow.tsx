import { useState, useCallback, useEffect, useRef } from 'react';
import { IMessage, IErrorMessage } from '@chat-app/shared';
import { useChatSocket } from '../hooks/useChatSocket';
import { ConnectionStatus as ConnectionStatusType } from '../types/index.js';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConnectionStatus } from './ConnectionStatus';
import { UsernameScreen } from './UsernameScreen';
import { SearchModal } from './SearchModal';

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
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const errorTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Save username to localStorage whenever it changes
  useEffect(() => {
    if (username.trim()) {
      localStorage.setItem(USERNAME_STORAGE_KEY, username.trim());
    } else {
      localStorage.removeItem(USERNAME_STORAGE_KEY);
    }
  }, [username]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current);
      }
    };
  }, []);

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
    // Clear any existing timeout
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current);
      errorTimeoutRef.current = null;
    }
    
    const errorText = errorMessage.message || 'An error occurred';
    setError(errorText);
    
    // Clear max length error after 2 seconds, other errors after 5 seconds
    const timeout = errorMessage.code === 'CONTENT_TOO_LONG' ? 2000 : 5000;
    errorTimeoutRef.current = setTimeout(() => {
      setError((currentError) => {
        // Only clear if it's still the same error (prevents race conditions)
        if (currentError === errorText) {
          return null;
        }
        return currentError;
      });
      errorTimeoutRef.current = null;
    }, timeout);
  }, []);

  // Handle status change
  const handleStatusChange = useCallback((status: ConnectionStatusType) => {
    // Clear error when connected (but only if it's a connection-related error)
    if (status === 'connected') {
      setError((currentError) => {
        // Don't clear validation errors (like CONTENT_TOO_LONG) when connecting
        if (currentError && !currentError.includes('700 characters')) {
          return null;
        }
        return currentError;
      });
    } else if (status === 'reconnecting') {
      setError((currentError) => {
        // Don't overwrite validation errors
        if (currentError && currentError.includes('700 characters')) {
          return currentError;
        }
        return 'Connection lost. Reconnecting...';
      });
    } else if (status === 'disconnected') {
      setError((currentError) => {
        // Don't overwrite validation errors
        if (currentError && currentError.includes('700 characters')) {
          return currentError;
        }
        return 'Disconnected from server';
      });
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

  // Display error from socket or local state (but not when connected)
  // Validation errors (CONTENT_TOO_LONG) should only show in ChatInput, not ConnectionStatus
  const isValidationError = (msg: string | null | undefined): boolean => {
    if (!msg) return false;
    return msg.includes('700 characters') || msg.includes('cannot exceed');
  };
  const connectionError = status === 'connected' 
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
    <div className="chat-window">
      <div className="chat-window-header">
        <div className="chat-window-header-left">
          <h1>Chat App</h1>
          <span className="chat-window-username">{username}</span>
        </div>
        <div className="chat-window-header-right">
          <button className="search-button" onClick={() => setIsSearchOpen(true)} aria-label="Search messages">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth="2"/>
              <path d="m21 21-4.35-4.35" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <ConnectionStatus status={status} error={connectionError} />
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
