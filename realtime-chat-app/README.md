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

### WebSocket Library: Socket.IO

We chose **Socket.IO** over native WebSocket for several reasons:

1. **Automatic Reconnection**: Built-in reconnection logic with exponential backoff
2. **Transport Fallback**: Automatically falls back from WebSocket to HTTP long-polling if needed
3. **Event-Based API**: Clean, event-driven architecture
4. **Room Management**: Built-in support for rooms and namespaces (useful for future features)
5. **Error Handling**: Better error handling and connection state management
6. **Cross-Browser Compatibility**: Handles browser differences automatically

### Message History Management

The application maintains the **last 10 messages** on the server:

1. **Storage**: Messages are persisted to `apps/server/data/messages.json` on disk
2. **On Server Start**: Messages are loaded from disk automatically
3. **On New Message**: 
   - New message is added to the store
   - If more than 10 messages exist, only the last 10 are kept (older messages are trimmed)
   - Updated messages are saved to disk
4. **On Client Connect**: Server sends the last 10 messages immediately (history hydration)
5. **On Reconnect**: Client receives fresh history, preventing duplicates

This ensures:
- Messages persist across server restarts
- Clients always have recent conversation context
- Server memory usage stays bounded
- No message duplication on reconnect

## 📄 License

Private
