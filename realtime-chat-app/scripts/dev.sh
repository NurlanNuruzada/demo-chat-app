#!/bin/bash

# Development script to run both server and client concurrently

echo "Starting real-time chat application in development mode..."
echo "Server will run on http://localhost:3001"
echo "Client will run on http://localhost:5173"
echo ""

# Start server and client in parallel
npm run dev:server &
SERVER_PID=$!

npm run dev:client &
CLIENT_PID=$!

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "Shutting down..."
    kill $SERVER_PID 2>/dev/null
    kill $CLIENT_PID 2>/dev/null
    exit
}

# Trap SIGINT and SIGTERM
trap cleanup SIGINT SIGTERM

# Wait for both processes
wait
