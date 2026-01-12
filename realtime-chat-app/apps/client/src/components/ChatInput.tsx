import { FormEvent, KeyboardEvent, useEffect, useRef, useState, useCallback } from 'react';
import { TEXTAREA_CONFIG } from '../utils/constants';
import { isValidationError } from '../utils/errorHelpers';
import styles from './ChatInput.module.css';

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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMultiline, setIsMultiline] = useState(false);

  // Allow sending only if message is valid, username exists, and not disabled
  // Validation errors (like message too long) don't prevent editing, only sending
  const hasValidationError = error ? isValidationError(error) : false;
  const canSend =
    username.trim().length > 0 &&
    draft.trim().length > 0 &&
    !disabled &&
    !hasValidationError;

  // Extract message submission logic to avoid duplication
  const submitMessage = useCallback(() => {
    if (canSend) {
      onSend(username.trim(), draft.trim());
      onDraftChange('');
    }
  }, [canSend, username, draft, onSend, onDraftChange]);

  // Auto-resize textarea based on content (like WhatsApp)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';

    // Calculate new height (min: 1 line, max: ~6 lines)
    const { LINE_HEIGHT, MIN_LINES, MAX_LINES, HEIGHT_BUFFER } = TEXTAREA_CONFIG;
    const minHeight = LINE_HEIGHT * MIN_LINES;
    const maxHeight = LINE_HEIGHT * MAX_LINES;

    const scrollHeight = textarea.scrollHeight;
    const needsScroll = scrollHeight > maxHeight;
    const newHeight = needsScroll ? maxHeight : Math.max(scrollHeight, minHeight);

    textarea.style.height = `${newHeight}px`;

    // Set overflow based on content
    textarea.style.overflowY = needsScroll ? 'auto' : 'hidden';
    textarea.style.overflowX = 'hidden';

    // Update multiline state for container alignment
    const isNowMultiline = newHeight > minHeight + HEIGHT_BUFFER;
    setIsMultiline(isNowMultiline);
  }, [draft]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    submitMessage();
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Send on Enter, but allow Shift+Enter or Cmd+Enter (Mac) / Ctrl+Enter for new line
    if (e.key === 'Enter' && !e.shiftKey && !e.metaKey && !e.ctrlKey && canSend) {
      e.preventDefault();
      submitMessage();
    }
  };

  return (
    <div className={styles.chatInput}>
      {error && (
        <div className={styles.error} role="alert">
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} className={styles.form}>
        <div
          ref={containerRef}
          className={`${styles.messageContainer} ${isMultiline ? styles.multiline : ''}`}
        >
          <textarea
            ref={textareaRef}
            placeholder="Type a message..."
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.message}
            rows={1}
            disabled={disabled}
            // Always allow editing, even when message is too long - user needs to fix it
          />
          <button type="submit" disabled={!canSend} className={styles.sendButton} aria-label="Send message">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z" fill="currentColor"/>
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
}
