import json
import os
import signal
import sys
import atexit
import glob
import shutil
from datetime import datetime
from pymavlink import mavutil
import time
import argparse

parser = argparse.ArgumentParser(description='MAVLink listener with USB and telemetry support')
parser.add_argument('--connection', type=str, default='/dev/tty.usbmodem01',
                    help='Connection string (e.g., /dev/tty.usbmodem01 or /dev/tty.usbserial-*)')
parser.add_argument('--baud', type=int, default=115200,
                    help='Baud rate for serial connection')

args = parser.parse_args()

PARAMS_DIR = os.path.join('public', 'params')
HISTORY_DIR = os.path.join('public', 'params_history')
ARCHIVE_DIR = os.path.join('historical_data')
os.makedirs(PARAMS_DIR, exist_ok=True)
os.makedirs(HISTORY_DIR, exist_ok=True)
os.makedirs(ARCHIVE_DIR, exist_ok=True)

def cleanup_json_files():
    """Move all files from params_history to historical_data and clean up params"""
    try:
        # Create timestamped subdirectory in historical_data
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        session_dir = os.path.join(ARCHIVE_DIR, f"session_{timestamp}")
        os.makedirs(session_dir, exist_ok=True)
        
        # Move all files from params_history to historical_data
        history_files = glob.glob(os.path.join(HISTORY_DIR, '*.json'))
        for file_path in history_files:
            filename = os.path.basename(file_path)
            dest_path = os.path.join(session_dir, filename)
            shutil.move(file_path, dest_path)
        
        # Clean up params directory
        params_files = glob.glob(os.path.join(PARAMS_DIR, '*.json'))
        for file_path in params_files:
            os.remove(file_path)
        
        print(f"Archived {len(history_files)} history files to {session_dir}")
        print(f"Cleaned up {len(params_files)} params files")
    except Exception as e:
        print(f"Error cleaning up files: {e}")

def signal_handler(signum, frame):
    """Handle Ctrl+C gracefully"""
    print("\nReceived interrupt signal. Cleaning up...")
    cleanup_json_files()
    sys.exit(0)

# Register signal handlers and cleanup
signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)
atexit.register(cleanup_json_files)

def create_mavlink_connection(connection_str, baud_rate):
    try:
        return mavutil.mavlink_connection(connection_str, baud=baud_rate)
    except Exception as e:
        print(f"Failed to establish connection: {e}")
        return None

def check_heartbeat(master):
    try:
        msg = master.wait_heartbeat(timeout=5)
        return bool(msg)
    except Exception:
        return False

def write_to_json(data, filename):
    try:
        filepath = os.path.join(PARAMS_DIR, filename)
        with open(filepath, 'w') as f:
            json.dump(data, f)
    except Exception:
        pass

def request_data_streams(master):
    master.mav.request_data_stream_send(
        master.target_system, master.target_component,
        mavutil.mavlink.MAV_DATA_STREAM_ALL,
        50,  # 50Hz
        1    # Start
    )

def monitor_messages(master):
    message_types = {
        'ATTITUDE': 'ATTITUDE.json',
        'HEARTBEAT': 'HEARTBEAT.json',
        'RAW_IMU': 'RAW_IMU.json',
        'SCALED_IMU2': 'SCALED_IMU2.json',
        'LOCAL_POSITION_NED': 'LOCAL_POSITION_NED.json',
        'GLOBAL_POSITION_INT': 'GLOBAL_POSITION_INT.json',
        'BATTERY_STATUS': 'BATTERY_STATUS.json',
        'SYS_STATUS': 'SYS_STATUS.json',
        'RANGEFINDER': 'RANGEFINDER.json',
        'DISTANCE_SENSOR': 'DISTANCE_SENSOR.json',
        'AHRS': 'AHRS.json',
        'AHRS2': 'AHRS2.json'
    }

    msg = master.recv_match(blocking=False)
    if msg:
        msg_type = msg.get_type()
        if msg_type in message_types:
            data = msg.to_dict()
            if msg_type == 'BATTERY_STATUS' and data['current_battery'] > 0:
                data['time_remaining'] = int((data['battery_remaining'] / 100.0) * 
                                           (data['current_consumed'] / data['current_battery']))
            write_to_json(data, message_types[msg_type])

def main():
    print("Starting MAVLink listener...")
    print("Press Ctrl+C to stop and clean up files")
    
    # Clean up any existing files first
    cleanup_json_files()
    
    master = create_mavlink_connection(args.connection, args.baud)
    if not master or not check_heartbeat(master):
        print("Failed to establish connection or heartbeat")
        return

    request_data_streams(master)
    print("MAVLink connection established, generating JSON files...")

    try:
        while True:
            monitor_messages(master)
    except KeyboardInterrupt:
        print("\nKeyboard interrupt received")
    except Exception as e:
        print(f"Error in main loop: {e}")
    finally:
        print("Cleaning up and exiting...")
        cleanup_json_files()

if __name__ == "__main__":
    main()

    