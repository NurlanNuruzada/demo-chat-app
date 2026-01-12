/**
 * Client-to-server events
 * Union type for type-safe Socket.IO events from client
 */
export type ClientToServerEvent =
  | {
      type: 'send_message';
      payload: {
        user: string;
        content: string;
      };
    }
  | {
      type: 'read_messages';
      payload: {
        messageIds: string[];
        userId: string;
      };
    }
  | {
      type: 'join_room';
      payload: {
        userId: string;
      };
    }
  | {
      type: 'leave_room';
      payload: {
        userId: string;
      };
    }
  | {
      type: 'ping';
      payload: {
        timestamp: number;
      };
    };
