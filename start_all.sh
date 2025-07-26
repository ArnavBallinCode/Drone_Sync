#!/bin/bash

# SkySync GCS Startup Script for macOS
# This script opens multiple Terminal windows for the full system

PROJECT_DIR="$(pwd)"

echo "🚁 Starting SkySync Drone Ground Control Station..."
echo "📁 Project Directory: $PROJECT_DIR"
echo ""

# Terminal 1: MAVProxy (Hardware Bridge)
echo "🔗 Starting MAVProxy (Hardware Bridge)..."
osascript <<EOF
tell application "Terminal"
    do script "cd \"$PROJECT_DIR\"; echo '🔗 MAVProxy Hardware Bridge'; echo 'Update the serial port in this command:'; echo 'mavproxy.py --master=/dev/tty.usbserial-XXXX --baud=115200 --out=udp:localhost:14550 --console'; echo ''; echo 'Find your device with: ls /dev/tty.usb*'; echo 'Then run the mavproxy command above with the correct port.'"
    activate
end tell
EOF

sleep 2

# Terminal 2: Telemetry Listener (via UDP)
echo "📡 Starting Telemetry Listener..."
osascript <<EOF
tell application "Terminal"
    do script "cd \"$PROJECT_DIR\"; echo '📡 Telemetry Listener'; echo 'Activating conda environment and starting listener...'; conda activate drone; python3 listen.py --connection=udp:localhost:14550"
    activate
end tell
EOF

sleep 2

# Terminal 3: Next.js Web Interface
echo "🌐 Starting Web Interface..."
osascript <<EOF
tell application "Terminal"
    do script "cd \"$PROJECT_DIR\"; echo '🌐 Web Interface Starting...'; echo 'Dashboard will be available at: http://localhost:3000'; echo ''; npm run dev"
    activate
end tell
EOF

sleep 3

echo ""
echo "✅ All services started!"
echo ""
echo "📋 Quick Setup Guide:"
echo "1. Terminal 1: Update the serial port and run MAVProxy command"
echo "2. Terminal 2: Telemetry listener should auto-start"
echo "3. Terminal 3: Web interface starting at http://localhost:3000"
echo ""
echo "🔍 Find your USB device: ls /dev/tty.usb*"
echo "🌐 Open dashboard: http://localhost:3000"
echo ""