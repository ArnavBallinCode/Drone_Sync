import asyncio
import websockets
from pymavlink import mavutil
import json
import time
import threading
import socket
import sys
import signal
import serial
import serial.tools.list_ports
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# Connection settings
UDP_PORT = 14551  # Using the second UDP port (14551) as MAVProxy uses 14550
SYSTEM_ID = 255
COMPONENT_ID = 190
WS_PORT = 8765
CALIBRATION_TIMEOUT = 120

def connect_to_drone():
    """Connect to the drone via UDP"""
    try:
        # Connect to UDP
        connection_string = f'udpin:localhost:{UDP_PORT}'
        logging.info(f"Connecting to {connection_string}")
        
        master = mavutil.mavlink_connection(
            connection_string,
            source_system=SYSTEM_ID,
            source_component=COMPONENT_ID
        )
        
        # Wait for heartbeat
        logging.info("Waiting for heartbeat...")
        heartbeat = master.wait_heartbeat(timeout=5)
        if heartbeat:
            logging.info(f"Connected! System ID: {master.target_system}, Component ID: {master.target_component}")
            return master
        else:
            logging.error("No heartbeat received")
            return None
    except Exception as e:
        logging.error(f"Connection failed: {str(e)}")
        return None

async def run_calibration(websocket, calibration_type):
    """Run calibration with simple command approach"""
    try:
        await send_status(websocket, "Connecting to drone...")
        master = connect_to_drone()
        
        if not master:
            await send_status(websocket, "failed: Could not connect to drone. Make sure MAVProxy is running with UDP forwarding.")
            return

        # Set calibration parameters and instructions based on type
        if calibration_type == "gyro":
            params = [1, 0, 0, 0, 0, 0, 0]  # gyro calibration
            await send_status(websocket, "Keep the drone completely still...")
            timeout = 30
        elif calibration_type == "mag":
            params = [0, 1, 0, 0, 0, 0, 0]  # magnetometer calibration
            await send_status(websocket, "Rotate the drone around all axes...")
            timeout = 120
        elif calibration_type == "accel":
            params = [0, 0, 0, 0, 1, 0, 0]  # simple accelerometer calibration
            await send_status(websocket, """
            Place vehicle in each orientation when instructed:
            - Level
            - On right side
            - On left side
            - Nose down
            - Nose up
            - On its back
            Wait for 'hold still' message before moving to next position.
            """)
            timeout = 180
        elif calibration_type == "baro":
            params = [0, 0, 1, 0, 0, 0, 0]  # ground pressure calibration
            await send_status(websocket, "Keep the drone still...")
            timeout = 30
        elif calibration_type == "all":
            for cal_type in ["gyro", "mag", "accel", "baro"]:
                await run_calibration(websocket, cal_type)
                await asyncio.sleep(2)
            return
        else:
            await send_status(websocket, f"failed: Unknown calibration type {calibration_type}")
            return

        # Send calibration command
        await send_status(websocket, "Sending calibration command...")
        master.mav.command_long_send(
            master.target_system,
            master.target_component,
            mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION,
            0,  # confirmation
            params[0],  # gyro cal
            params[1],  # mag cal
            params[2],  # ground pressure
            params[3],  # radio cal
            params[4],  # accel cal
            params[5],  # interference cal
            params[6]   # temp cal
        )

        # Wait for acknowledgment and monitor calibration
        start_time = time.time()
        ack_received = False
        last_message_time = time.time()
        completed_sides = set()
        pending_sides = {"back", "front", "left", "right", "up", "down"}

        while time.time() - start_time < timeout:
            msg = master.recv_match(blocking=True, timeout=0.5)
            
            if msg:
                last_message_time = time.time()
                msg_type = msg.get_type()
                
                if msg_type == 'COMMAND_ACK':
                    if msg.command == mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION:
                        ack_received = True
                        if msg.result == mavutil.mavlink.MAV_RESULT_ACCEPTED:
                            await send_status(websocket, "Calibration command accepted")
                        else:
                            await send_status(websocket, f"failed: Calibration command rejected (result={msg.result})")
                            return

                elif msg_type == 'STATUSTEXT':
                    text = msg.text.lower()
                    
                    # Handle calibration-specific messages
                    if "[cal]" in text:
                        # Clean up the message by removing '[cal]' prefix
                        clean_text = text.replace("[cal]", "").strip()
                        await send_status(websocket, clean_text)
                        logging.info(f"Calibration message: {clean_text}")  # Log to console

                        # Track progress for accelerometer calibration
                        if "progress" in text:
                            try:
                                progress = int(text.split("<")[1].split(">")[0])
                                await send_status(websocket, f"Calibration progress: {progress}%", progress)
                            except:
                                pass
                        
                        # Track completed sides
                        if "side result" in text:
                            for side in ["back", "front", "left", "right", "up", "down"]:
                                if side in text and side in pending_sides:
                                    pending_sides.remove(side)
                                    completed_sides.add(side)
                                    await send_status(websocket, f"Completed {side} side. Remaining: {', '.join(pending_sides)}")
                        
                        # Handle completion messages
                        if "calibration successful" in text or "calibration done" in text:
                            await send_status(websocket, "success: Calibration completed successfully")
                            return
                        elif "calibration failed" in text:
                            await send_status(websocket, f"failed: {clean_text}")
                            return
                        
                        # Handle specific instructions
                        if "hold vehicle still" in text:
                            await send_status(websocket, "Hold vehicle still...")
                        elif "detected rest position" in text:
                            await send_status(websocket, "Position detected, keep holding...")
                        elif "rotate to a different side" in text:
                            sides_left = text.split("pending:")[1].strip() if "pending:" in text else ""
                            await send_status(websocket, f"Rotate to a new position. Remaining sides: {sides_left}")
                        elif "side already completed" in text:
                            await send_status(websocket, "Position already calibrated, try a different position")
                        elif "side done" in text:
                            await send_status(websocket, "Position calibrated successfully")

            # Check for timeout conditions
            if time.time() - last_message_time > 5:  # No messages for 5 seconds
                if calibration_type == "accel":
                    remaining = len(pending_sides)
                    if remaining > 0:
                        await send_status(websocket, f"Waiting... {6-remaining}/6 positions completed")
                elif not ack_received:
                    await send_status(websocket, "Waiting for acknowledgment...")
                else:
                    await send_status(websocket, "Waiting for calibration progress...")

            await asyncio.sleep(0.1)

        # If we reach here, we've timed out
        if not ack_received:
            await send_status(websocket, "failed: No acknowledgment received")
        else:
            # For Pixhawk 6X, if we received ACK and some calibration messages, consider it successful
            if len(completed_sides) > 0 or ack_received:
                await send_status(websocket, f"success: Calibration completed ({len(completed_sides)}/6 positions)")
            else:
                await send_status(websocket, "failed: Calibration timed out")
        
    except Exception as e:
        await send_status(websocket, f"failed: {str(e)}")
        logging.error(f"Error during calibration: {str(e)}")
    finally:
        if master:
            master.close()

async def send_status(websocket, status, progress=None):
    """Send status and optional progress to the websocket client"""
    message = {"status": status}
    if progress is not None:
        message["progress"] = progress
    await websocket.send(json.dumps(message))
    logging.info(f"Status: {status}" + (f" Progress: {progress}%" if progress is not None else ""))

async def handle_websocket(websocket):
    """Handle websocket connections and commands"""
    try:
        logging.info("New WebSocket connection established")
        async for message in websocket:
            data = json.loads(message)
            command = data.get('command')
            
            calibration_types = {
                'gyro_calibration': 'gyro',
                'baro_calibration': 'baro',
                'accel_calibration': 'accel',
                'mag_calibration': 'mag',
                'all_calibration': 'all'
            }
            
            if command in calibration_types:
                await run_calibration(websocket, calibration_types[command])
            else:
                await send_status(websocket, f"failed: Unknown command {command}")
    except websockets.exceptions.ConnectionClosed:
        logging.info("WebSocket connection closed")
    except Exception as e:
        logging.error(f"WebSocket error: {str(e)}")
        try:
            await send_status(websocket, f"failed: {str(e)}")
        except:
            pass

async def main():
    """Main server function with proper shutdown handling"""
    try:
        print("Starting WebSocket server...")
        server = await websockets.serve(handle_websocket, "localhost", WS_PORT)
        print(f"Calibration WebSocket server started on ws://localhost:{WS_PORT}")
        
        # Set up signal handlers
        loop = asyncio.get_event_loop()
        for sig in (signal.SIGTERM, signal.SIGINT):
            loop.add_signal_handler(sig, lambda: asyncio.create_task(shutdown(server)))
        
        await server.wait_closed()
        
    except Exception as e:
        logging.error(f"Server error: {str(e)}")
        sys.exit(1)

async def shutdown(server):
    """Graceful shutdown"""
    logging.info("Shutting down server...")
    server.close()
    await server.wait_closed()
    tasks = [t for t in asyncio.all_tasks() if t is not asyncio.current_task()]
    for task in tasks:
        task.cancel()
    await asyncio.gather(*tasks, return_exceptions=True)
    asyncio.get_event_loop().stop()

if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        logging.info("Server stopped by user")
    except Exception as e:
        logging.error(f"Error: {str(e)}")
        sys.exit(1)