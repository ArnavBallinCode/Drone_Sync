#!/bin/bash

PROJECT_DIR="$(pwd)"

# Terminal 1: MAVProxy (Hardware Bridge)
osascript <<EOF
tell application "Terminal"
    do script "cd \"$PROJECT_DIR\"; mavproxy.py --master=/dev/tty.usbserial-XXXX --baud=115200 --out=udp:localhost:14550 --console"
    activate
end tell
EOF

# Terminal 2: Telemetry Listener (via UDP)
osascript <<EOF
tell application "Terminal"
    do script "cd \"$PROJECT_DIR\"; conda activate drone; python3 listen.py --connection=udp:localhost:14550"
    activate
end tell
EOF

# # Terminal 3: Calibration Server
# osascript <<EOF
# tell application "Terminal"
#     do script "cd \"$PROJECT_DIR\"; conda activate drone; python3 calibrating/calibration_server.py"
#     activate
# end tell
# EOF

# Terminal 4: Next.js Web Interface
osascript <<EOF
tell application "Terminal"
    do script "cd \"$PROJECT_DIR\"; npm run dev"
    activate
end tell
EOF