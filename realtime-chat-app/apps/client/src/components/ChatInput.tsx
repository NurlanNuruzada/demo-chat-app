import {FormEvent, KeyboardEvent, useEffect, useRef } from 'react';

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

  // Allow sending only if message is valid, username exists, and not disabled
  // Validation errors (like message too long) don't prevent editing, only sending
  const isValidationError = error?.includes('700 characters') || error?.includes('cannot exceed');
  const canSend = username.trim().length > 0 && draft.trim().length > 0 && !disabled && !isValidationError;

  // Auto-resize textarea based on content (like WhatsApp)
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Calculate new height (min: 1 line, max: ~6 lines)
    const lineHeight = 22; // Approximately line-height in pixels (1.375rem * 16 = 22px)
    const minHeight = lineHeight; // 1 line
    const maxHeight = lineHeight * 6; // ~6 lines (max-height: 6rem = 96px)
    
    const scrollHeight = textarea.scrollHeight;
    const needsScroll = scrollHeight > maxHeight;
    const newHeight = needsScroll ? maxHeight : Math.max(scrollHeight, minHeight);
    
    textarea.style.height = `${newHeight}px`;
    
    // Always allow scrolling when content exceeds max height
    if (needsScroll) {
      textarea.style.overflowY = 'auto';
      textarea.style.overflowX = 'hidden';
    } else {
      textarea.style.overflowY = 'hidden';
      textarea.style.overflowX = 'hidden';
    }
    
    // Update container alignment: center for single line, flex-end for multiline
    const container = textarea.closest('.chat-input-message-container') as HTMLElement | null;
    if (container) {
      if (newHeight <= minHeight + 2) {
        container.style.alignItems = 'center'; // Center vertically for single line
      } else {
        container.style.alignItems = 'flex-end'; // Align to bottom for multiline (text at top)
      }
    }
  }, [draft]);

  const handleSubmit = (e: FormEvent<HTMLFormElement>): void => {
    e.preventDefault();
    if (canSend) {
      onSend(username.trim(), draft.trim());
      onDraftChange('');
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>): void => {
    // Send on Enter, but allow Shift+Enter or Cmd+Enter (Mac) / Ctrl+Enter for new line
    if (e.key === 'Enter') {
      const isNewLine = e.shiftKey || e.metaKey || e.ctrlKey;
      if (!isNewLine && canSend) {
        e.preventDefault();
        onSend(username.trim(), draft.trim());
        onDraftChange('');
      }
      // If Shift/Cmd/Ctrl+Enter, allow default behavior (new line)
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
            ref={textareaRef}
            placeholder="Type a message..."
            value={draft}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={handleKeyDown}
            className="chat-input-message"
            rows={1}
            disabled={disabled}
            // Always allow editing, even when message is too long - user needs to fix it
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
