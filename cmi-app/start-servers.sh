#!/bin/bash

echo "Starting CMI Application Servers..."
echo "=================================="

# Function to cleanup on exit
cleanup() {
    echo -e "\n\nShutting down servers..."
    kill $NEXTJS_PID $WS_PID 2>/dev/null
    exit
}

# Set up trap to call cleanup on script exit
trap cleanup EXIT INT TERM

# Start WebSocket server
echo "Starting WebSocket server on port 3001..."
npm run ws-server &
WS_PID=$!

# Give WebSocket server time to start
sleep 2

# Start Next.js development server
echo "Starting Next.js development server on port 3000..."
npm run dev &
NEXTJS_PID=$!

echo -e "\n✅ Both servers are starting up!"
echo "📡 WebSocket server: ws://localhost:3001"
echo "🌐 Next.js app: http://localhost:3000"
echo -e "\nPress Ctrl+C to stop both servers\n"

# Wait for both processes
wait 