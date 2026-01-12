import { useState, useEffect, useRef, useCallback, KeyboardEvent } from 'react';
import { IMessage } from '@chat-app/shared';
import { formatTime } from '../utils/formatTime';
import styles from './SearchModal.module.css';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: IMessage[];
  onMessageSelect?: (messageId: string) => void;
}

/**
 * Filter messages based on search query
 */
function filterMessages(messages: IMessage[], query: string): IMessage[] {
  if (!query.trim()) return [];
  const lowerQuery = query.toLowerCase();
  return messages.filter(
    (message) =>
      message.content.toLowerCase().includes(lowerQuery) ||
      message.user.toLowerCase().includes(lowerQuery)
  );
}

/**
 * Search modal component for searching through messages
 * WhatsApp-style search functionality
 */
export function SearchModal({ isOpen, onClose, messages, onMessageSelect }: SearchModalProps): JSX.Element | null {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<IMessage[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Filter messages based on search query
  useEffect(() => {
    const filtered = filterMessages(messages, searchQuery);
    setFilteredMessages(filtered);
    setSelectedIndex(-1);
  }, [searchQuery, messages]);

  // Handle keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>): void => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < filteredMessages.length - 1 ? prev + 1 : prev
        );
        return;
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
        return;
      }

      if (e.key === 'Enter' && selectedIndex >= 0 && filteredMessages[selectedIndex]) {
        e.preventDefault();
        onMessageSelect?.(filteredMessages[selectedIndex].id);
      }
    },
    [filteredMessages, selectedIndex, onClose, onMessageSelect]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (selectedIndex >= 0 && resultsRef.current) {
      const selectedElement = resultsRef.current.querySelector(
        `[data-index="${selectedIndex}"]`
      ) as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [selectedIndex]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search messages..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            className={styles.input}
            autoFocus
          />
          <button className={styles.closeButton} onClick={onClose} aria-label="Close search">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className={styles.results} ref={resultsRef}>
          {filteredMessages.length === 0 && searchQuery.trim() ? (
            <div className={styles.empty}>No messages found</div>
          ) : filteredMessages.length === 0 ? (
            <div className={styles.empty}>Type to search messages...</div>
          ) : (
            <>
              <div className={styles.count}>
                {filteredMessages.length} {filteredMessages.length === 1 ? 'message' : 'messages'} found
              </div>
              {filteredMessages.map((message, index) => (
                <div
                  key={message.id}
                  data-index={index}
                  className={`${styles.item} ${selectedIndex === index ? styles.selected : ''}`}
                  onClick={() => onMessageSelect?.(message.id)}
                >
                  <div className={styles.itemHeader}>
                    <span className={styles.itemUser}>{message.user}</span>
                    <span className={styles.itemTime}>{formatTime(message.timestamp)}</span>
                  </div>
                  <div className={styles.itemContent}>{message.content}</div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
