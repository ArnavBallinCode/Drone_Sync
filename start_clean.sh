#!/bin/bash

# Cleanup function
cleanup() {
    echo ""
    echo "Shutting down services..."
    
    # Kill listen.py if running
    if [ ! -z "$LISTEN_PID" ]; then
        echo "Stopping listen.py (PID: $LISTEN_PID)"
        kill $LISTEN_PID 2>/dev/null
        wait $LISTEN_PID 2>/dev/null
    fi
    
    # Kill npm dev server if running
    if [ ! -z "$NPM_PID" ]; then
        echo "Stopping npm dev server (PID: $NPM_PID)"
        kill $NPM_PID 2>/dev/null
        wait $NPM_PID 2>/dev/null
    fi
    
    # Clean up JSON files
    echo "Cleaning up JSON files..."
    node cleanup.js
    
    echo "Cleanup complete"
    exit 0
}

# Set trap to call cleanup function on script exit
trap cleanup SIGINT SIGTERM EXIT

echo "Starting SkySync Ground Control Station..."
echo "Press Ctrl+C to stop all services and clean up"

# Clean up any existing files first
echo "Initial cleanup..."
node cleanup.js

# Check if listen.py connection argument is provided
CONNECTION=${1:-"/dev/tty.usbmodem01"}
BAUD=${2:-115200}

echo "Starting MAVLink listener on $CONNECTION at $BAUD baud..."

# Start listen.py in background
python3 listen.py --connection="$CONNECTION" --baud=$BAUD &
LISTEN_PID=$!

# Wait a moment for listen.py to initialize
sleep 2

echo "Starting Next.js development server..."

# Start npm dev server in background
npm run dev &
NPM_PID=$!

echo ""
echo "Services started:"
echo "  - MAVLink Listener (PID: $LISTEN_PID)"
echo "  - Next.js Dev Server (PID: $NPM_PID)"
echo "  - Dashboard: http://localhost:3000"
echo ""
echo "Press Ctrl+C to stop all services"

# Wait for both processes
wait
