import { useState, useCallback } from 'react';
import { IMessage, IErrorMessage } from '@chat-app/shared';
import { useChatSocket } from '../hooks/useChatSocket';
import { ConnectionStatus as ConnectionStatusType } from '../types/index.js';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { ConnectionStatus } from './ConnectionStatus';

/**
 * Main chat window component
 * Manages state and WebSocket connection
 */
export function ChatWindow(): JSX.Element {
  const [messages, setMessages] = useState<IMessage[]>([]);
  const [username, setUsername] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

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

  // WebSocket hook
  const { status, connected, sendMessage, error: socketError } = useChatSocket({
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

  // Display error from socket or local state
  const displayError = socketError?.message || error;

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <h1>Chat App</h1>
        <ConnectionStatus status={status} error={displayError} />
      </div>
      <MessageList messages={messages} />
      <ChatInput
        username={username}
        onUsernameChange={setUsername}
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        disabled={!connected}
        error={displayError}
      />
    </div>
  );
}
