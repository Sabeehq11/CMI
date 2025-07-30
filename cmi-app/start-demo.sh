#!/bin/bash

echo "🚀 Starting CMI Demo Application"
echo "================================"

# Kill any existing processes on our ports
echo "🧹 Cleaning up old processes..."
lsof -ti:3000 | xargs kill -9 2>/dev/null
lsof -ti:3001 | xargs kill -9 2>/dev/null
lsof -ti:3002 | xargs kill -9 2>/dev/null

# Give processes time to clean up
sleep 1

# Change to the app directory
cd "$(dirname "$0")"

echo "📡 Starting WebSocket server..."
npm run ws-server &
WS_PID=$!

# Wait for WebSocket server to start
sleep 2

echo "🌐 Starting Next.js development server..."
npm run dev &
NEXT_PID=$!

# Wait for Next.js to start
sleep 3

echo ""
echo "✅ Application is starting!"
echo "================================"
echo "🌐 Open your browser to: http://localhost:3000/student"
echo "📡 WebSocket server: ws://localhost:3001/websocket"
echo ""
echo "Press Ctrl+C to stop all servers"
echo ""

# Function to cleanup on exit
cleanup() {
    echo -e "\n🛑 Shutting down servers..."
    kill $WS_PID $NEXT_PID 2>/dev/null
    exit
}

# Set up trap to cleanup on exit
trap cleanup EXIT INT TERM

# Keep script running
wait 