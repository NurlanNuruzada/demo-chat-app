import { IMessage } from './IMessage';
import { IErrorMessage } from './ErrorMessage';

/**
 * Server-to-client events
 * Union type for type-safe Socket.IO events from server
 */
export type ServerToClientEvent =
  | {
      type: 'history';
      payload: {
        messages: IMessage[];
      };
    }
  | {
      type: 'new_message';
      payload: {
        message: IMessage;
      };
    }
  | {
      type: 'error';
      payload: IErrorMessage;
    }
  | {
      type: 'status';
      payload: {
        connected: boolean;
        message?: string;
      };
    }
  | {
      type: 'message_read';
      payload: {
        messageId: string;
        readBy: string;
        readAt: number;
      };
    };
