/**
 * Format timestamp to WhatsApp-style time format (HH:MM)
 * Note: Uses local timezone. All messages are displayed in the user's local time.
 * For multi-timezone support, consider standardizing to UTC or adding timezone indicators.
 */
export function formatTime(timestamp: number): string {
  const date = new Date(timestamp);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Format timestamp to full time string with date
 */
export function formatFullTime(timestamp: number): string {
  return new Date(timestamp).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}
