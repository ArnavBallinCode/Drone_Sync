import json
import os
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
os.makedirs(PARAMS_DIR, exist_ok=True)

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
    master = create_mavlink_connection(args.connection, args.baud)
    if not master or not check_heartbeat(master):
        return

    request_data_streams(master)

    try:
        while True:
            monitor_messages(master)
    except KeyboardInterrupt:
        pass
    except Exception as e:
        print(f"Error in main loop: {e}")

if __name__ == "__main__":
    main()

    