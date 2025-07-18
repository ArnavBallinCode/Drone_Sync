from flask import Flask, jsonify, render_template, send_from_directory
from pymavlink import mavutil
import threading
import time
import os
import json

app = Flask(__name__)

# Global variables for MAVLink connection
mavlink_data = {}
PARAMS_DIR = os.path.join('public', 'params')
os.makedirs(PARAMS_DIR, exist_ok=True)

# List of parameter types to monitor
PARAM_TYPES = [
    'ATTITUDE', 
    'AHRS', 
    'AHRS2', 
    'BATTERY_STATUS', 
    'HEARTBEAT',
    'DISTANCE_SENSOR', 
    'GLOBAL_POSITION_INT',  
    'RANGEFINDER',
    'RAW_IMU',  
    'SCALED_IMU2',
    'LOCAL_POSITION_NED'
]

def create_mavlink_connection():
    try:
        # Try serial connection first
        connection = mavutil.mavlink_connection('/dev/tty.usbserial-0001', baud=57600)
        print("Connected to MAVLink via serial")
        return connection
    except Exception as e:
        print(f"Serial connection failed: {e}")
        try:
            # Fallback to UDP
            connection = mavutil.mavlink_connection('udp:0.0.0.0:14550')
            print("Connected to MAVLink via UDP")
            return connection
        except Exception as e:
            print(f"UDP connection failed: {e}")
            return None

def mavlink_listener():
    master = create_mavlink_connection()
    if not master:
        print("Failed to establish MAVLink connection")
        return

    # Wait for heartbeat
    master.wait_heartbeat()
    print("Heartbeat received")

    while True:
        for param_type in PARAM_TYPES:
            try:
                # Request data stream
                master.mav.request_data_stream_send(
                    master.target_system, master.target_component,
                    mavutil.mavlink.MAV_DATA_STREAM_ALL, 4, 1)
                
                # Get message
                msg = master.recv_match(type=param_type, blocking=True, timeout=0.5)
                if msg:
                    # Update global data
                    data = msg.to_dict()
                    mavlink_data[param_type] = data
                    
                    # Save to file
                    file_path = os.path.join(PARAMS_DIR, f"{param_type}.json")
                    with open(file_path, 'w') as f:
                        json.dump(data, f, indent=4)
                    
                    print(f"Updated {param_type}")
            except Exception as e:
                print(f"Error getting {param_type}: {e}")
        
        time.sleep(0.1)  # Small delay between cycles

# Flask routes
@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/mavlink/<param_type>')
def get_mavlink_data(param_type):
    if param_type in mavlink_data:
        return jsonify(mavlink_data[param_type])
    return jsonify({'error': 'Parameter not found'}), 404

@app.route('/params/<path:filename>')
def serve_param_file(filename):
    return send_from_directory(PARAMS_DIR, filename)

@app.route('/static/<path:path>')
def serve_static(path):
    return send_from_directory('static', path)

if __name__ == "__main__":
    # Start MAVLink listener thread
    mavlink_thread = threading.Thread(target=mavlink_listener, daemon=True)
    mavlink_thread.start()
    
    # Start Flask server
    app.run(host='0.0.0.0', port=80, debug=True, use_reloader=False) 