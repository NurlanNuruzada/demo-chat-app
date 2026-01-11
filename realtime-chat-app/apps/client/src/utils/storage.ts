import { STORAGE_KEYS } from './constants';

/**
 * Storage utility functions for localStorage
 */
export const storage = {
  /**
   * Get username from localStorage
   */
  getUsername(): string {
    return localStorage.getItem(STORAGE_KEYS.USERNAME) || '';
  },

  /**
   * Save username to localStorage
   */
  setUsername(username: string): void {
    if (username.trim()) {
      localStorage.setItem(STORAGE_KEYS.USERNAME, username.trim());
    } else {
      localStorage.removeItem(STORAGE_KEYS.USERNAME);
    }
  },

  /**
   * Remove username from localStorage
   */
  removeUsername(): void {
    localStorage.removeItem(STORAGE_KEYS.USERNAME);
  },
};
