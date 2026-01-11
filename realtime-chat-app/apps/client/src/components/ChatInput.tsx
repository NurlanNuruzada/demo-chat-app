import { useState, FormEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
  username: string;
  onUsernameChange: (username: string) => void;
  draft: string;
  onDraftChange: (draft: string) => void;
  onSend: (user: string, content: string) => void;
  disabled?: boolean;
  error?: string | null;
}

/**
 * Chat input component with username and message fields
 * Handles form submission and Enter key press
 */
export function ChatInput({
  username,
  onUsernameChange,
  draft,
  onDraftChange,
  onSend,
  disabled = false,
  error,
}: ChatInputProps): JSX.Element {
  const canSend = username.trim().length > 0 && draft.trim().length > 0 && !disabled;

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (canSend) {
      onSend(username.trim(), draft.trim());
      onDraftChange('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Send on Enter (but allow Shift+Enter for new line)
    if (e.key === 'Enter' && !e.shiftKey && canSend) {
      e.preventDefault();
      onSend(username.trim(), draft.trim());
      onDraftChange('');
    }
  };

  return (
    <div className="chat-input">
      {error && (
        <div className="chat-input-error" role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className="chat-input-form">
        <input
          type="text"
          placeholder="Your name"
          value={username}
          onChange={(e) => onUsernameChange(e.target.value)}
          className="chat-input-username"
          disabled={disabled}
        />
        <div className="chat-input-message-container">
          <textarea
            placeholder="Type a message..."
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="chat-input-message"
            rows={1}
            disabled={disabled}
          />
          <button type="submit" disabled={!canSend} className="chat-input-send">
            Send
          </button>
        </div>
      </form>
    </div>
  );
}
