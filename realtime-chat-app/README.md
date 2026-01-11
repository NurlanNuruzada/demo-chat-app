# Real-time Chat Application

A real-time chat application built with Socket.IO, React, TypeScript, and a monorepo structure.

## 🏗️ Architecture

- **Monorepo Structure**: Using npm workspaces
- **Backend**: Node.js + Socket.IO server (Port: 3001)
- **Frontend**: React + Vite (Port: 5173)
- **Shared**: Common types and utilities

## 📦 Packages

- `apps/server` - Socket.IO server with message handling
- `apps/client` - React client application
- `packages/shared` - Shared types and interfaces

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

```bash
npm install
```

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

### Environment Variables

Copy `.env.example` to `.env` and configure:

```bash
cp .env.example .env
```

- `SERVER_PORT`: Backend WebSocket server port (default: 3001)
- `CORS_ORIGIN`: Frontend origin for CORS (default: http://localhost:5173)

## 🛠️ Scripts

- `npm run dev` - Start all apps in development mode
- `npm run build` - Build all packages
- `npm run lint` - Lint all packages
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting

## 📋 Features

- Real-time messaging with Socket.IO
- Message validation (required: non-empty content, optional: max length 500, username validation)
- Message read receipts (track who read messages)
- Message timestamps and user identification
- Connection status indicator
- Auto-reconnection on disconnect

## 🔧 Tech Stack

- **Backend**: Node.js, Socket.IO, TypeScript
- **Frontend**: React, Vite, TypeScript, Socket.IO Client
- **Code Quality**: ESLint, Prettier
- **Monorepo**: npm workspaces

## 📝 Message Validation Rules

### Required
- Content must not be empty

### Bonus
- Maximum message length: 500 characters
- Username must not be empty
- Automatic whitespace trimming

## 🐳 Docker

```bash
docker-compose up
```

## 📄 License

Private
