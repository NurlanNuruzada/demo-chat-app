/**
 * Error message structure for error events
 */
export interface IErrorMessage {
  type: 'error';
  code: string;
  message: string;
  field?: string;
}
