# SkySync Drone Ground Control Station

A real-time drone monitoring and control system built with Next.js, featuring live telemetry visualization, safe spot detection, and Jetson device integration.

## Features

- **Real-time Telemetry Monitoring**: Live data visualization from MAVLink-compatible drones
- **Safe Spot Detection**: Arena-based navigation with detection alerts and mission completion tracking
- **Interactive Dashboard**: Clean, responsive interface with live data feeds
- **History & Analytics**: Data collection, storage, and downloadable reports (JSON/CSV)
- **Jetson Integration**: SCP-based data fetching from Jetson devices for arena and safe spot data
- **Auto-Collect Mode**: Global auto-collection state for continuous data gathering

## Prerequisites

Before setting up the project, ensure you have:

- **Node.js** (v18+ recommended)
- **Python 3.7+** with pip
- **MAVLink-compatible drone** or simulator
- **Jetson device** (optional, for real arena data)

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
├── app/                    # Next.js app directory
│   ├── page.tsx           # Main dashboard
│   ├── history/           # History and analytics page
│   └── api/               # API routes for data handling
├── components/            # React components
├── public/
│   ├── params/           # Live telemetry data (JSON files)
│   └── params_history/   # Historical data storage
├── listen.py             # MAVLink telemetry listener
├── server.py             # Alternative Python server
└── start_all.sh          # Automated startup script
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

## Dashboard Features

### Main Dashboard (`/`)
- **Live Telemetry**: Real-time data from connected drone
- **Safe Spot Visualization**: Interactive arena map with detection zones
- **Jetson Events**: Live status updates from Jetson device
- **YouTube Feed**: Embedded live stream (configurable)
- **Z vs Time Chart**: Altitude tracking over time

### History Page (`/history`)
- **Data Analytics**: Historical telemetry visualization
- **Download Options**: Export data as JSON or CSV
- **Time Range Filtering**: Filter data by date/time
- **Clear History**: Reset collected data

## Troubleshooting

### Common Issues

1. **Connection Failed**
   ```bash
   # Check available USB devices
   ls /dev/tty.usb*
   
   # Verify device permissions
   sudo chmod 666 /dev/tty.usbmodem01
   ```

2. **No Telemetry Data**
   - Ensure drone is powered and connected
   - Check baud rate matches drone configuration
   - Verify MAVLink is enabled on the drone

3. **Build Errors**
   ```bash
   # Clear Next.js cache
   rm -rf .next
   npm run build
   ```

4. **Python Dependencies**
   ```bash
   # Reinstall pymavlink
   pip uninstall pymavlink
   pip install pymavlink
   ```

### Data Storage

- **Live Data**: Stored in `/public/params/` as JSON files
- **Historical Data**: Stored in `/public/params_history/`
- **Auto-Collection**: Controlled via global context, shared between pages

## Development

### Key Files

- `listen.py`: MAVLink telemetry collection and JSON file generation
- `app/page.tsx`: Main dashboard interface
- `app/api/history-data/route.ts`: Telemetry collection and download API
- `components/dashboard-safespot.tsx`: Safe spot visualization component

### Adding New Telemetry Parameters

1. Update `listen.py` to capture new MAVLink messages
2. Add corresponding JSON file handling
3. Update dashboard components to display new data

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues and questions:
1. Check the troubleshooting section above
2. Verify all prerequisites are installed
3. Ensure proper device connections and permissions
