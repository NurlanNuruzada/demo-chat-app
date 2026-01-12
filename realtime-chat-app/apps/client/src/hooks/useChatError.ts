import { useState, useCallback } from 'react';
import { IErrorMessage } from '@chat-app/shared';
import { ConnectionStatus } from '../types/index.ts';
import { useErrorTimeout } from './useErrorTimeout';
import { isValidationError } from '../utils/errorHelpers';

interface UseChatErrorReturn {
  error: string | null;
  setError: (error: string | null) => void;
  handleError: (errorMessage: IErrorMessage) => void;
  handleStatusChange: (status: ConnectionStatus) => void;
  getConnectionError: (status: ConnectionStatus, socketError: IErrorMessage | null) => string | null;
  getInputError: () => string | null;
  clearError: () => void;
}

/**
 * Hook for managing chat error state and handling
 * Centralizes all error-related logic
 */
export function useChatError(): UseChatErrorReturn {
  const [error, setError] = useState<string | null>(null);
  const { setErrorTimeout, clearErrorTimeout } = useErrorTimeout();

  // Handle error from socket or validation
  const handleError = useCallback(
    (errorMessage: IErrorMessage) => {
      clearErrorTimeout();
      const errorText = errorMessage.message || 'An error occurred';
      setError(errorText);

      // Set timeout to clear error
      setErrorTimeout(() => {
        setError((currentError) => {
          // Only clear if it's still the same error (prevents race conditions)
          if (currentError === errorText) {
            return null;
          }
          return currentError;
        });
      }, errorMessage.code);
    },
    [setErrorTimeout, clearErrorTimeout]
  );

  // Handle status change and update error accordingly
  const handleStatusChange = useCallback(
    (status: ConnectionStatus) => {
      setError((currentError) => {
        // Don't overwrite validation errors
        if (currentError && isValidationError(currentError)) {
          return currentError;
        }

        // Set appropriate error message based on status
        switch (status) {
          case 'connected':
            return null;
          case 'reconnecting':
            return 'Connection lost. Reconnecting...';
          case 'disconnected':
            return 'Disconnected from server';
          default:
            return currentError;
        }
      });
    },
    []
  );

  // Get connection error (excludes validation errors)
  const getConnectionError = useCallback(
    (status: ConnectionStatus, socketError: IErrorMessage | null): string | null => {
      if (status === 'connected') {
        return null;
      }

      if (socketError?.message && !isValidationError(socketError.message)) {
        return socketError.message;
      }

      if (error && !isValidationError(error)) {
        return error;
      }

      return null;
    },
    [error]
  );

  // Get input error (includes all errors, including validation)
  const getInputError = useCallback((): string | null => {
    return error;
  }, [error]);

  // Clear error manually
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    setError,
    handleError,
    handleStatusChange,
    getConnectionError,
    getInputError,
    clearError,
  };
}
