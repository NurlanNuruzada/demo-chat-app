/**
 * Safely parse JSON with error handling
 */
export function safeJsonParse<T>(json: string, fallback: T): T {
  try {
    return JSON.parse(json) as T;
  } catch (error) {
    console.error('JSON parse error:', error);
    return fallback;
  }
}

/**
 * Safely parse JSON and return result with success flag
 */
export function tryJsonParse<T>(json: string): { success: boolean; data?: T; error?: Error } {
  try {
    const data = JSON.parse(json) as T;
    return { success: true, data };
  } catch (error) {
    return { success: false, error: error as Error };
  }
}
