from pymavlink import mavutil
import time

# Define the serial port and baud rate for macOS
# Update this if your Pixhawk is connected to a different port
SERIAL_PORT = "/dev/tty.usbserial-D30JKVZM" 
BAUD_RATE = 57600

def run_gyro_calibration():
    """Connects to Pixhawk, sends gyro calibration command, and waits for ACK."""
    print(f"Attempting to connect to Pixhawk on {SERIAL_PORT} at {BAUD_RATE} baud...")
    
    # Connect to the Pixhawk
    try:
        master = mavutil.mavlink_connection(SERIAL_PORT, baud=BAUD_RATE)
    except Exception as e:
        print(f"Error connecting to Pixhawk: {e}")
        return

    # Wait for a heartbeat to ensure connection is ready
    print("Waiting for heartbeat from vehicle...")
    try:
        master.wait_heartbeat(timeout=10)  # Added timeout
    except Exception as e:
        print(f"No heartbeat received within timeout: {e}")
        master.close()
        return
        
    print(f"Heartbeat received from system (sysid={master.target_system}, compid={master.target_component})")

    # Send command to calibrate gyro
    print("Sending gyro calibration command (MAV_CMD_PREFLIGHT_CALIBRATION)...")
    try:
        master.mav.command_long_send(
            master.target_system,            # target_system
            master.target_component,         # target_component
            mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION,  # command
            0,                               # confirmation
            1,  # param1: 1 to calibrate gyroscope
            0,  # param2: accelerometer (0 = no)
            0,  # param3: magnetometer (0 = no)
            0,  # param4: ground pressure (barometer) (0 = no)
            0,  # param5: radio (0 = no)
            0,  # param6: airspeed sensor (0 = no)
            0   # param7: not used
        )
        print("Gyro calibration command sent.")
    except Exception as e:
        print(f"Error sending command: {e}")
        master.close()
        return

    # Wait for COMMAND_ACK
    print("Waiting for COMMAND_ACK...")
    ack_received = False
    start_time = time.time()
    timeout_seconds = 30  # Wait up to 30 seconds for ACK

    while time.time() - start_time < timeout_seconds:
        msg = master.recv_match(type='COMMAND_ACK', blocking=False) # Non-blocking with loop
        if msg:
            if msg.command == mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION:
                print(f"COMMAND_ACK received:")
                print(f"  Command: {msg.command} (MAV_CMD_PREFLIGHT_CALIBRATION)")
                print(f"  Result: {msg.result} ({mavutil.mavlink.enums['MAV_RESULT'][msg.result].name if msg.result in mavutil.mavlink.enums['MAV_RESULT'] else 'UNKNOWN_RESULT'})")
                ack_received = True
                break
            else:
                # Log other ACKs if necessary, but don't break
                print(f"Received unrelated COMMAND_ACK for command {msg.command}")
        time.sleep(0.1) # Short delay to prevent busy-waiting

    if not ack_received:
        print(f"No COMMAND_ACK received for gyro calibration within {timeout_seconds} seconds.")

    if ack_received:
        print("COMMAND_ACK received. calibration process was initiated.")

    print("Closing connection.")
    master.close()

if __name__ == "__main__":
    run_gyro_calibration()
