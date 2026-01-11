# Real-time Chat Application

A real-time chat application built with Socket.IO, React, TypeScript, and a monorepo structure. Features a single shared chat room where multiple users can communicate in real-time.

## 🏗️ Architecture

- **Monorepo Structure**: Using npm workspaces
- **Backend**: Node.js + Socket.IO server (Port: 3001)
- **Frontend**: React + Vite (Port: 5173 in dev, Port: 80 in Docker)
- **Shared**: Common types and interfaces

## 📦 Packages

- `apps/server` - Socket.IO server with message handling
- `apps/client` - React client application
- `packages/shared` - Shared types and interfaces

## 📋 Prerequisites

- **Node.js**: >= 18.0.0 (see `.nvmrc` for recommended version)
- **npm**: >= 9.0.0
- **Docker** (optional): For containerized deployment

## 🚀 Getting Started

### Installation

Install all dependencies from the root directory:

```bash
npm install
```

This will install dependencies for all workspaces (server, client, and shared).

### Development

Start both server and client in development mode:

```bash
npm run dev
```

Or start them separately:

```bash
# Start server only
npm run dev:server

# Start client only
npm run dev:client
```

### Opening the Application

Once the development servers are running:

- **Frontend**: Open http://localhost:5173 in your browser
- **Backend**: Running on http://localhost:3001

## 🐳 Docker (Production)

### Quick Start

Build and run everything with Docker:

```bash
docker compose up --build
```

Then open http://localhost in your browser.

### Docker Services

- **server**: Node.js backend with Socket.IO (Port: 3001)
- **client**: Nginx serving the built React frontend (Port: 80)

### Stop Services

```bash
docker compose down
```

## 🛠️ Scripts

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run format` - Format code with Prettier

## 📝 Features

### Core Functionality
- **Real-time messaging**: Instant message delivery using Socket.IO WebSocket
- **Multi-user chat**: Multiple users can chat simultaneously in a shared room
- **Message history**: Last 10 messages persist across server restarts
- **Connection management**: Automatic reconnection with status indicators

### User Experience
- **Username management**: 
  - Username entry screen before accessing chat
  - Username saved in localStorage for convenience
  - Logout functionality to clear session
- **UI**: 
  - Dark theme with modern design
  - Message bubbles (own messages vs others)
  - Responsive layout for all screen sizes
  - Auto-resizing textarea (grows up to 6 lines, then scrolls)
  - Text centered when single line, top-aligned when multiline

### Message Features
- **Message validation**:
  - Maximum length: 700 characters
  - Username required
  - Empty message prevention
  - Real-time validation feedback
- **Message display**:
  - Timestamps (formatted time display)
  - Sender identification
  - Visual distinction between own and others' messages

### Search & Navigation
- **Message search**: 
  - Search by message content or username
  - Keyboard navigation (Arrow keys, Enter, Escape)
  - Real-time filtering
  - Search modal with results preview

### Connection & Reliability
- **Connection status**: Visual indicator showing Connected/Connecting/Reconnecting/Not Connected
- **Auto-reconnection**: Automatic reconnection with exponential backoff
- **Error handling**: 
  - User-friendly error messages
  - Validation errors auto-dismiss after 2-5 seconds
  - Connection errors hidden from users (technical errors filtered)
- **History synchronization**: 
  - Messages sent on every connection
  - Prevents duplicates on reconnect
  - Deterministic message order

## 🔧 Tech Stack

- **Backend**: Node.js, Socket.IO, TypeScript
- **Frontend**: React, Vite, TypeScript, Socket.IO Client
- **Code Quality**: ESLint, Prettier
- **Monorepo**: npm workspaces

## 📚 Technical Details

### Your Choice of WebSocket Library and Why

We chose **Socket.IO** over native WebSocket for several important reasons:

1. **Automatic Reconnection**: Built-in reconnection logic with exponential backoff, eliminating the need for manual reconnection handling. Socket.IO automatically attempts to reconnect when the connection is lost.

2. **Transport Fallback**: Automatically falls back from WebSocket to HTTP long-polling if WebSocket is blocked or unavailable (common in corporate networks, proxies, or certain browsers). This ensures the application works in all network conditions.

3. **Event-Based API**: Clean, event-driven architecture that matches React's event handling patterns. Events like `connect`, `disconnect`, `new_message`, and `history` are easily handled with callbacks.

4. **Connection State Management**: Built-in connection state tracking (`socket.connected`, `socket.disconnected`) simplifies UI state management and prevents sending messages when disconnected.

5. **Error Handling**: Better error handling with `connect_error` events that can be filtered and handled gracefully, hiding technical errors from users while maintaining automatic reconnection.

6. **Cross-Browser Compatibility**: Handles browser differences automatically, ensuring consistent behavior across Chrome, Firefox, Safari, and Edge.

7. **Room Management**: Built-in support for rooms and namespaces (useful for future features like private chats or multiple chat rooms).

8. **Developer Experience**: Excellent TypeScript support and well-documented API that speeds up development and reduces bugs.

### How You Handled the State Synchronization of the "Last 10 Messages" on the Server

The application maintains exactly **10 messages** on the server with the following state synchronization strategy:

#### 1. **Message Storage Architecture**
- **In-Memory Store**: Messages are stored in a `MessageStore` class (`apps/server/src/store/messageStore.ts`) with an in-memory array
- **Persistent Storage**: Messages are automatically persisted to `apps/server/data/messages.json` on disk after every modification
- **Automatic Loading**: On server start, messages are loaded from disk into memory

#### 2. **State Synchronization Flow**

**On New Message** (`messageHandler.ts:94`):
```typescript
// Store message (automatically trims to last 10)
messageStore.addMessage(message);
```

**In MessageStore.addMessage()** (`messageStore.ts:58-67`):
```typescript
addMessage(message: IMessage): void {
  this.messages.push(message);
  
  // Keep only the last MAX_MESSAGES (10)
  if (this.messages.length > MAX_MESSAGES) {
    this.messages = this.messages.slice(-MAX_MESSAGES);
  }
  
  this.saveMessages(); // Persist to disk
}
```

**Trimming Logic**: When a new message is added:
1. Message is pushed to the array
2. If array length exceeds 10, only the last 10 messages are kept using `slice(-10)`
3. Array is immediately saved to disk to persist the trimmed state

#### 3. **Client Synchronization**

**On Client Connect** (`connectionHandler.ts:17-18`):
```typescript
// Send connection hydration (last 10 messages)
sendHistory(socket);
```

**History Delivery** (`connectionHandler.ts:32-36`):
```typescript
const messages: IMessage[] = messageStore.getLastMessages(HISTORY_MESSAGE_COUNT);
socket.emit('history', {
  type: 'history',
  payload: { messages },
});
```

**Client Handling** (`ChatWindow.tsx:47-50`):
```typescript
const handleHistory = useCallback((historyMessages: IMessage[]) => {
  setMessages(historyMessages);
}, []);
```
