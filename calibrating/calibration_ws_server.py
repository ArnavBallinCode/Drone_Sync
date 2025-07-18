import asyncio
import websockets
import json
from pymavlink import mavutil
from threading import Thread
import time
import serial
import logging
import os
import socket

# Configure logging for better debugging
logging.basicConfig(
    level=logging.DEBUG,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler()
    ]
)

connected_clients = set()

# Connect to your drone (update connection string as needed)
master = mavutil.mavlink_connection('//dev/tty.usbmodem01', baud=57600)

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

# Directory to save calibration status files
PARAMS_DIR = os.path.join('public', 'params')
os.makedirs(PARAMS_DIR, exist_ok=True)

def mavlink_reader(loop, mavlink_queue):
    while True:
        try:
            msg = master.recv_match(blocking=True)
            if msg:
                logging.debug(f"MAVLink message received: {msg}")
                if msg.get_type() == 'BAD_DATA':
                    logging.warning(f"Skipping BAD_DATA message: {msg}")
                    continue
                asyncio.run_coroutine_threadsafe(mavlink_queue.put(msg), loop)
        except serial.SerialException as e:
            logging.error(f"SerialException: {e}. Retrying connection...")
            reconnect_to_device()
        time.sleep(0.1)

def reconnect_to_device():
    global master
    while True:
        try:
            master = mavutil.mavlink_connection('/dev/tty.usbserial-D30JKVZM', baud=57600)
            logging.info("Reconnected to the telemetry device.")
            break
        except serial.SerialException as e:
            logging.warning(f"Failed to reconnect: {e}. Retrying in 5 seconds...")
            time.sleep(5)

async def process_mavlink_messages(mavlink_queue):
    while True:
        msg = await mavlink_queue.get()
        if msg.get_type() == 'BAD_DATA':
            logging.warning(f"Ignoring BAD_DATA message: {msg}")
            continue
        logging.debug(f"Processing MAVLink message: {msg}")
        if msg.get_type() == 'STATUSTEXT':
            message = {
                "type": "status",
                "text": msg.text.strip() if isinstance(msg.text, str) else msg.text.decode('utf-8').strip()
            }
            logging.info(f"STATUSTEXT message: {message}")
            save_to_params_file('calibration_status.json', message)
            await broadcast(json.dumps(message))
        elif msg.get_type() == 'COMMAND_ACK':
            cmd_map = {241: "Gyro", 222: "Barometer"}
            if msg.command in cmd_map:
                status = "success" if msg.result == 0 else "failed"
                ack_message = {
                    "type": "calibration_ack",
                    "sensor": cmd_map[msg.command],
                    "status": status,
                    "result": int(msg.result)
                }
                logging.info(f"COMMAND_ACK message: {ack_message}")
                save_to_params_file('calibration_ack.json', ack_message)
                await broadcast(json.dumps(ack_message))

        for param_type in PARAM_TYPES:
            try:
                msg = master.recv_match(type=param_type, blocking=True, timeout=0.5)
                if msg:
                    param_data = msg.to_dict()
                    logging.info(f"Received {param_type}: {param_data}")
                    save_to_params_file(param_type, param_data)
            except Exception as e:
                logging.error(f"Error processing {param_type}: {e}")
        logging.info("Completed parameter cycle, waiting before next cycle...")
        time.sleep(1)

async def broadcast(message):
    for ws in connected_clients.copy():
        try:
            await ws.send(message)
        except websockets.exceptions.ConnectionClosed:
            connected_clients.remove(ws)

async def handle_calibration(websocket, path):
    connected_clients.add(websocket)
    logging.info("WebSocket client connected.")
    try:
        async for message in websocket:
            try:
                data = json.loads(message)
                command = data.get("command")
                logging.info(f"Received calibration command: {command}")

                if command == 241:  # Gyro
                    logging.debug("Preparing to send Gyro calibration command via MAVLink.")
                    try:
                        master.mav.command_long_send(
                            master.target_system,
                            master.target_component,
                            mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION,
                            0,
                            1,  # Gyro calibration
                            0, 0, 0, 0, 0, 0
                        )
                        logging.info("Gyro calibration command sent to the drone.")
                        save_to_params_file('calibration_command.json', {"command": "Gyro", "status": "sent"})
                    except Exception as e:
                        logging.error(f"Failed to send Gyro calibration command: {e}")
                        save_to_params_file('calibration_command.json', {"command": "Gyro", "status": "failed"})

            except json.JSONDecodeError as e:
                logging.error(f"Invalid JSON received: {message}. Error: {e}")
            except Exception as e:
                logging.error(f"Unexpected error: {e}")
    except Exception as e:
        logging.error(f"Error in handle_calibration: {e}")
    finally:
        connected_clients.remove(websocket)
        logging.info("WebSocket client disconnected.")

def save_to_params_file(param_type, param_data):
    file_path = os.path.join(PARAMS_DIR, f"{param_type}.json")
    try:
        with open(file_path, 'w') as json_file:
            json.dump(param_data, json_file, indent=4)
        logging.info(f"Successfully wrote to {file_path}: {param_data}")
    except Exception as e:
        logging.error(f"Failed to write to {file_path}: {e}")

def is_port_in_use(port):
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        return s.connect_ex(('localhost', port)) == 0

def get_available_port(start_port):
    port = start_port
    while True:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            if s.connect_ex(('localhost', port)) != 0:
                return port
            port += 1

async def main():
    loop = asyncio.get_running_loop()
    mavlink_queue = asyncio.Queue()
    Thread(target=mavlink_reader, args=(loop, mavlink_queue), daemon=True).start()

    # Dynamically find an available port starting from 8765
    port = get_available_port(8765)
    logging.info(f"WebSocket calibration server running on ws://localhost:{port}")

    async with websockets.serve(handle_calibration, "localhost", port):
        asyncio.create_task(process_mavlink_messages(mavlink_queue))
        await asyncio.Future()

if __name__ == "__main__":
    asyncio.run(main())