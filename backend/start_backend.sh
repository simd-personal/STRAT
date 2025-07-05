#!/bin/bash

# Start Backend Server Script
echo "🚀 Starting Stratos Backend Server..."

# Navigate to backend directory
cd /Users/simba/Stratos/backend

# Activate virtual environment
echo "📦 Activating virtual environment..."
source venv/bin/activate

# Check if port 8000 is already in use
if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null ; then
    echo "⚠️  Port 8000 is already in use. Stopping existing process..."
    pkill -f "uvicorn main:app"
    sleep 2
fi

# Start the server
echo "🌐 Starting FastAPI server on http://localhost:8000"
echo "📡 WebSocket endpoints:"
echo "   - Dispatcher: ws://localhost:8000/ws/dispatcher"
echo "   - Responder: ws://localhost:8000/ws/responder"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

uvicorn main:app --reload --host 0.0.0.0 --port 8000 