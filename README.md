## Installation

### 1. Clone and Setup

```bash
# Clone the repository
git clone <repository-url>
cd SkySync_Gcs-1.1

# Install Node.js dependencies
npm install
```

### 2. Python Environment Setup

```bash
# Create a conda environment (recommended)
conda create -n drone python=3.9
conda activate drone

# Install Python dependencies
pip install pymavlink
```

### 3. Project Structure

```
SkySync_Gcs-1.1/
├──  app/                     # Next.js 13+ App Directory (Main Application)
│   ├── globals.css            # Global Tailwind CSS styles
│   ├── layout.tsx             # Root layout wrapper for all pages
│   ├── page.tsx               #  MAIN DASHBOARD (/) - Primary interface
│   ├── history/               #  History & Analytics Section
│   │   └── page.tsx          # History analysis page with charts & downloads
│   └── api/                   #  Backend API Routes (Next.js Server Functions)
│       ├── history-data/      # Telemetry collection & history management
│       │   └── route.ts      # Handles data collection, storage, download, clear
│       ├── jetson-data/       # Jetson device integration
│       │   └── route.ts      # SCP fetch for arena & safe spot data
│       ├── logs/              # System logs API
│       │   └── route.ts      # Log file access
│       └── status-text/       # Jetson events/status
│           └── route.ts      # SCP fetch for events data
│
├──  components/             # Reusable React Components
│   ├── ui/                   # Shadcn/UI component library
│   │   ├── alert.tsx        # Alert notifications
│   │   ├── badge.tsx        # Status badges
│   │   ├── button.tsx       # Interactive buttons
│   │   ├── card.tsx         # Container cards
│   │   ├── select.tsx       # Dropdown selectors
│   │   ├── tabs.tsx         # Tab navigation
│   │   └── toast.tsx        # Toast notifications
│   ├── auto-collect-button.tsx    # Auto-collection toggle control
│   ├── dashboard-header.tsx       # Main dashboard header
│   ├── dashboard-layout.tsx       # Dashboard layout wrapper
│   ├── dashboard-livedata.tsx     # Live telemetry display
│   ├── dashboard-parameters.tsx   # Parameter monitoring
│   ├── dashboard-safespot.tsx     #  Safe spot visualization & arena
│   ├── main-layout.tsx            # Overall app layout
│   ├── mode-toggle.tsx            # Dark/light theme toggle
│   ├── navigation.tsx             # Navigation menu
│   ├── telemetry-overview.tsx     # Telemetry summary cards
│   └── theme-provider.tsx         # Theme context provider
│
├── 🔗 contexts/               # React Context (Global State)
│   └── auto-collect-context.tsx  # Global auto-collect state management
│
├──  hooks/                  # Custom React Hooks
│   ├── use-mobile.tsx        # Mobile device detection
│   └── use-toast.ts          # Toast notification hook
│
├──  lib/                    # Utility Libraries
│   ├── api.ts               # API helper functions
│   └── utils.ts             # Common utility functions
│
├──  public/                # Static Files & Data Storage
│   ├── params/              # 📡 LIVE telemetry data (JSON files)
│   │   ├── attitude.json    # Real-time attitude data
│   │   ├── battery_status.json    # Battery information
│   │   ├── global_position_int.json # Position data
│   │   ├── heartbeat.json         # System heartbeat
│   │   ├── local_position_ned.json # NED coordinates
│   │   ├── raw_imu.json          # IMU sensor data
│   │   ├── rangefinder.json      # Distance sensor data
│   │   └── scaled_imu2.json      # Secondary IMU data
│   ├── params_history/       # 📊 Historical data storage
│   │   └── telemetry_*.json  # Timestamped history files
│   └── [static assets]       # Images, icons, etc.
│
├──  Python Backend         # MAVLink Communication Layer
│   ├── listen.py            # 🔌 MAIN MAVLink listener & JSON generator
│   ├── server.py            # Alternative Python server
│   └── start_all.sh         # 🚀 Automated startup script
│
└──  Configuration Files
    ├── package.json         # Node.js dependencies & scripts
    ├── tsconfig.json        # TypeScript configuration
    ├── tailwind.config.ts   # Tailwind CSS configuration
    ├── next.config.mjs      # Next.js configuration
    └── components.json      # Shadcn/UI configuration

```

## Usage

### Option 1: Manual Setup (Recommended for Testing)

#### Step 1: Start the Telemetry Listener
```bash
# Activate Python environment
conda activate drone

# For USB connection (direct to drone)
python3 listen.py --connection=/dev/tty.usbmodem01 --baud=115200

# For UDP connection (via MAVProxy)
python3 listen.py --connection=udp:localhost:14550

# For TCP connection
python3 listen.py --connection=tcp:localhost:5760
```

#### Step 2: Start the Web Interface
```bash
# In a separate terminal
npm run dev
```

#### Step 3: Access the Dashboard
Open your browser and navigate to: http://localhost:3000

### Option 2: Automated Setup (macOS only)

For automated startup on macOS, use the provided script:

```bash
# Make the script executable
chmod +x start_all.sh

# Run the startup script
./start_all.sh
```

This will automatically open multiple Terminal windows for:
- MAVProxy (hardware bridge)
- Telemetry listener
- Next.js web interface

## Configuration

### Connection Types

The `listen.py` script supports various connection methods:

```bash
# USB Serial (most common for direct connection)
python3 listen.py --connection=/dev/tty.usbmodem01 --baud=115200

# UDP (for MAVProxy or SITL)
python3 listen.py --connection=udp:localhost:14550

# TCP
python3 listen.py --connection=tcp:localhost:5760

# Find your USB device (macOS)
ls /dev/tty.usb*
```

### Jetson SCP Configuration

For real Jetson data integration, ensure SSH key authentication is set up:

```bash
# Generate SSH keys (if not already done)
ssh-keygen -t rsa -b 4096 -C "your_email@example.com"

# Copy public key to Jetson
ssh-copy-id user@jetson-ip-address

# Test passwordless connection
ssh user@jetson-ip-address
```

