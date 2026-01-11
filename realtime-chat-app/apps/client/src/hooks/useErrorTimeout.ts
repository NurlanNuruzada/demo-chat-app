import { useRef, useCallback } from 'react';
import { VALIDATION } from '../utils/constants';

/**
 * Hook for managing error message timeouts
 */
export function useErrorTimeout() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const setErrorTimeout = useCallback(
    (callback: () => void, errorCode?: string) => {
      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }

      // Set timeout based on error type
      const timeout =
        errorCode === 'CONTENT_TOO_LONG'
          ? VALIDATION.ERROR_TIMEOUT_SHORT
          : VALIDATION.ERROR_TIMEOUT_LONG;

      timeoutRef.current = setTimeout(() => {
        callback();
        timeoutRef.current = null;
      }, timeout);
    },
    []
  );

  const clearErrorTimeout = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { setErrorTimeout, clearErrorTimeout };
}
