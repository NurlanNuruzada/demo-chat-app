import { useState, FormEvent, KeyboardEvent } from 'react';

interface ChatInputProps {
  username: string;
  draft: string;
  onDraftChange: (draft: string) => void;
  onSend: (user: string, content: string) => void;
  disabled?: boolean;
  error?: string | null;
}

/**
 * Chat input component with message field
 * Handles form submission and Enter key press
 */
export function ChatInput({
  username,
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
          <button type="submit" disabled={!canSend} className="chat-input-send" aria-label="Send message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
