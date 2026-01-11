import { useState, useCallback } from 'react';
import { IMessage, IErrorMessage } from '@chat-app/shared';
import { useChatSocket } from '../hooks/useChatSocket';
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

  // Handle history (replace messages)
  const handleHistory = useCallback((historyMessages: IMessage[]) => {
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
  const handleStatusChange = useCallback((connected: boolean) => {
    if (!connected) {
      setError('Connection lost. Reconnecting...');
    } else {
      setError(null);
    }
  }, []);

  // WebSocket hook
  const { connected, sendMessage } = useChatSocket({
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

  return (
    <div className="chat-window">
      <div className="chat-window-header">
        <h1>Chat App</h1>
        <ConnectionStatus connected={connected} error={error} />
      </div>
      <MessageList messages={messages} />
      <ChatInput
        username={username}
        onUsernameChange={setUsername}
        draft={draft}
        onDraftChange={setDraft}
        onSend={handleSend}
        disabled={!connected}
        error={error}
      />
    </div>
  );
}
