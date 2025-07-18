from pymavlink import mavutil
import time
import os
import threading
import sys
import serial
import serial.tools.list_ports

# Connection settings
SERIAL_PORT = "/dev/tty.usbserial-D30JKVZM"
BAUD_RATES = [57600, 115200, 921600, 38400]  # Common Pixhawk baud rates
SYSTEM_ID = 255
COMPONENT_ID = 190

# Calibration timeout in seconds
CALIBRATION_TIMEOUT = 120
RETRY_ATTEMPTS = 3
SENSOR_INIT_TIMEOUT = 10

def initialize_sensors(master):
    """Initialize and verify sensors are ready"""
    print("\nInitializing sensors...")
    start_time = time.time()
    
    while time.time() - start_time < SENSOR_INIT_TIMEOUT:
        msg = master.recv_match(type='SYS_STATUS', blocking=True, timeout=1)
        if msg:
            sensors_present = msg.onboard_control_sensors_present
            sensors_enabled = msg.onboard_control_sensors_enabled
            sensors_health = msg.onboard_control_sensors_health
            
            if sensors_enabled & mavutil.mavlink.MAV_SYS_STATUS_SENSOR_3D_GYRO:
                print("Gyroscope initialized")
            if sensors_enabled & mavutil.mavlink.MAV_SYS_STATUS_SENSOR_3D_ACCEL:
                print("Accelerometer initialized")
            if sensors_enabled & mavutil.mavlink.MAV_SYS_STATUS_SENSOR_3D_MAG:
                print("Magnetometer initialized")
            if sensors_enabled & mavutil.mavlink.MAV_SYS_STATUS_SENSOR_ABSOLUTE_PRESSURE:
                print("Barometer initialized")
                
            if sensors_health == sensors_enabled:
                print("All sensors initialized and healthy")
                return True
                
        time.sleep(0.5)
    
    print("Warning: Sensor initialization timed out")
    return False

def send_heartbeat(master):
    """Send heartbeat messages continuously"""
    while True:
        master.mav.heartbeat_send(
            SYSTEM_ID,
            COMPONENT_ID,
            mavutil.mavlink.MAV_TYPE_GCS,
            mavutil.mavlink.MAV_AUTOPILOT_INVALID,
            0, 0
        )
        time.sleep(1)

def list_serial_ports():
    """List all available serial ports"""
    ports = serial.tools.list_ports.comports()
    print("\nAvailable serial ports:")
    for port in ports:
        print(f"- {port.device} ({port.description})")

def test_serial_connection(port, baud):
    """Test if we can open the serial port"""
    try:
        ser = serial.Serial(port, baud, timeout=1)
        ser.close()
        return True
    except Exception as e:
        print(f"Serial port test failed: {str(e)}")
        return False

def try_connection(port, baud):
    """Try to connect with specific baud rate"""
    try:
        print(f"\nTrying baud rate: {baud}")
        master = mavutil.mavlink_connection(
            port,
            baud=baud,
            source_system=SYSTEM_ID,
            source_component=COMPONENT_ID
        )
        
        print("Monitoring for any MAVLink messages...")
        start_time = time.time()
        while time.time() - start_time < 5:  # Monitor for 5 seconds
            msg = master.recv_match(blocking=True, timeout=1)
            if msg:
                print(f"Received message: {msg.get_type()}")
                if msg.get_type() == "HEARTBEAT":
                    print(f"Success! Connected at {baud} baud")
                    return master
            else:
                print(".", end="", flush=True)
        print("\nNo messages received")
        master.close()
    except Exception as e:
        print(f"Connection error: {str(e)}")
    return None

def connect_drone():
    """Establish connection with proper verification"""
    print("Scanning for drone connection...")
    
    # List available ports
    list_serial_ports()
    
    # Test serial connection first
    if not test_serial_connection(SERIAL_PORT, BAUD_RATES[0]):
        print("Failed to open serial port. Please check your connection.")
        print("\nTrying to read raw data from port...")
        try:
            with serial.Serial(SERIAL_PORT, BAUD_RATES[0], timeout=1) as ser:
                data = ser.read(100)
                if data:
                    print(f"Raw data received: {data.hex()}")
                else:
                    print("No raw data received")
        except Exception as e:
            print(f"Raw read failed: {str(e)}")
        return None
    
    # Try each baud rate
    for baud in BAUD_RATES:
        master = try_connection(SERIAL_PORT, baud)
        if master:
            print(f"Connected to system {master.target_system} | Component {master.target_component}")
            print(f"Vehicle type: {master.flightmode}, System status: {master.system_status}")
            
            # Start heartbeat thread
            heartbeat_thread = threading.Thread(target=send_heartbeat, args=(master,), daemon=True)
            heartbeat_thread.start()
            
            # Request data streams
            master.mav.request_data_stream_send(
                master.target_system,
                master.target_component,
                mavutil.mavlink.MAV_DATA_STREAM_ALL,
                10,  # 10Hz rate
                1    # Start sending
            )
            
            # Wait for initial data
            time.sleep(1)
            return master
    
    print("\nFailed to connect at any baud rate")
    print("\nTroubleshooting tips:")
    print("1. Make sure the drone is powered on")
    print("2. Check USB connections")
    print("3. Try unplugging and replugging the USB")
    print("4. Verify no other program is using the port")
    print("5. Check if QGroundControl or Mission Planner is running")
    print("6. Try a different USB cable")
    print("7. Check if the flight controller needs to be rebooted")
    return None

def verify_sensor_health(master):
    """Verify sensor health before calibration"""
    try:
        msg = master.recv_match(type='SYS_STATUS', blocking=True, timeout=5)
        if msg:
            sensors_health = msg.onboard_control_sensors_health
            sensors_enabled = msg.onboard_control_sensors_enabled
            
            if sensors_health == sensors_enabled:
                print("All enabled sensors are healthy")
                return True
            else:
                print("Warning: Some sensors may not be functioning properly")
                return False
    except Exception as e:
        print(f"Failed to verify sensor health: {str(e)}")
        return False

def wait_for_completion(master, timeout=CALIBRATION_TIMEOUT):
    """Enhanced calibration completion monitoring"""
    start_time = time.time()
    last_progress = -1
    
    # First wait for command acknowledgment
    while time.time() - start_time < 10:  # 10 second timeout for initial ACK
        msg = master.recv_match(type='COMMAND_ACK', blocking=True, timeout=1)
        if msg and msg.command == mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION:
            if msg.result != mavutil.mavlink.MAV_RESULT_ACCEPTED:
                print(f"Calibration command rejected: {msg.result}")
                return False
            print("Calibration command accepted")
            break
    
    # Then monitor calibration progress
    start_time = time.time()
    while time.time() - start_time < timeout:
        msg = master.recv_match(blocking=True, timeout=1)
        if not msg:
            continue
            
        if msg.get_type() == 'STATUSTEXT':
            text = msg.text.lower()
            print(f"Status: {msg.text}")
            
            # Check for completion messages
            if "calibration successful" in text or "calibration done" in text:
                return True
            if "calibration failed" in text or "failed" in text:
                return False
                
        elif msg.get_type() == 'PROGRESS':
            if msg.progress != last_progress:
                print(f"Progress: {msg.progress}%")
                last_progress = msg.progress
    
    print("Calibration timed out")
    return False

def send_calibration_command(master, params):
    """Send calibration command with QGC-style parameters"""
    print("\nSending calibration command...")
    
    # Send pre-calibration command to prepare the system
    master.mav.command_long_send(
        master.target_system,
        master.target_component,
        mavutil.mavlink.MAV_CMD_PREFLIGHT_STORAGE,
        0,  # confirmation
        0,  # Parameter 1 (0 = read from flash)
        0,  # Parameter 2
        0,  # Parameter 3
        0,  # Parameter 4
        0,  # Parameter 5
        0,  # Parameter 6
        0   # Parameter 7
    )
    time.sleep(1)
    
    # Send actual calibration command
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
        params[5],  # compass/motor interference
        params[6]   # temp cal
    )
    
    return wait_for_completion(master)

def calibrate_gyro(master):
    print("\n=== Starting Gyroscope Calibration ===")
    print("Keep the drone completely still...")
    params = [1, 0, 0, 0, 0, 0, 0]  # Only gyro calibration
    return send_calibration_command(master, params)

def calibrate_baro(master):
    print("\n=== Starting Barometer Calibration ===")
    print("Keep the drone still and at a stable temperature...")
    params = [0, 0, 1, 0, 0, 0, 0]  # Only ground pressure calibration
    return send_calibration_command(master, params)

def calibrate_accel(master):
    print("\n=== Starting Accelerometer Calibration ===")
    print("Follow the orientation instructions:")
    print("1. Place vehicle level")
    print("2. On its left side")
    print("3. On its right side")
    print("4. On its nose")
    print("5. On its tail")
    print("6. On its back")
    params = [0, 0, 0, 0, 1, 0, 0]  # Only accelerometer calibration
    return send_calibration_command(master, params)

def calibrate_mag(master):
    print("\n=== Starting Magnetometer Calibration ===")
    print("Rotate the drone in all directions:")
    print("1. Rotate vehicle slowly around all axes")
    print("2. Continue rotation for at least 30 seconds")
    print("3. Keep away from metal objects")
    params = [0, 1, 0, 0, 0, 0, 0]  # Only magnetometer calibration
    return send_calibration_command(master, params)

def main():
    try:
        master = connect_drone()
        if not master:
            print("Failed to connect to drone")
            return
        
        while True:
            print("\nCalibration Menu:")
            print("1. Calibrate Gyroscope")
            print("2. Calibrate Barometer")
            print("3. Calibrate Accelerometer")
            print("4. Calibrate Magnetometer")
            print("5. Calibrate All Sensors")
            print("6. Exit")
            
            choice = input("\nEnter your choice (1-6): ")
            
            if choice == '1':
                calibrate_gyro(master)
            elif choice == '2':
                calibrate_baro(master)
            elif choice == '3':
                calibrate_accel(master)
            elif choice == '4':
                calibrate_mag(master)
            elif choice == '5':
                print("\n=== Starting Full Calibration Sequence ===")
                if calibrate_gyro(master):
                    time.sleep(2)
                    if calibrate_mag(master):
                        time.sleep(2)
                        if calibrate_accel(master):
                            time.sleep(2)
                            calibrate_baro(master)
            elif choice == '6':
                print("\nExiting...")
                break
            else:
                print("\nInvalid choice! Please try again.")
            
            time.sleep(1)
            
    except KeyboardInterrupt:
        print("\nProgram stopped by user")
    except Exception as e:
        print(f"\nError: {str(e)}")
    finally:
        try:
            master.close()
        except:
            pass

if __name__ == "__main__":
    main() 