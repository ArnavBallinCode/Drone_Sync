from pymavlink import mavutil
import time
import os

# Connection settings
SERIAL_PORT = "/dev/tty.usbmodem01"
BAUD_RATE = 57600

def check_port():
    if not os.path.exists(SERIAL_PORT):
        print(f"\nERROR: Port {SERIAL_PORT} not found!")
        print("\nPossible solutions:")
        print("1. Check if telemetry module is properly connected")
        print("2. Verify the correct port name:")
        print("   - Run 'ls /dev/tty.*' to list available ports")
        print("   - Common port names:")
        print("     * /dev/tty.usbmodem* (USB direct connection)")
        print("     * /dev/tty.usbserial* (FTDI/telemetry radio)")
        return False
    return True

def main():
    try:
        # First check if port exists
        if not check_port():
            return

        # Connect to the drone
        print(f"\nConnecting to {SERIAL_PORT} at {BAUD_RATE} baud...")
        print("(Make sure telemetry module is connected and powered)")
        master = mavutil.mavlink_connection(SERIAL_PORT, baud=BAUD_RATE)
        
        # Wait for heartbeat with more feedback
        print("\nWaiting for heartbeat...")
        print("If stuck here, check:")
        print("1. Is the drone powered on?")
        print("2. Is the telemetry module connected to TELEM1/TELEM2 port?")
        print("3. Are both telemetry modules (air and ground) powered?")
        
        heartbeat = master.wait_heartbeat(timeout=10)
        
        if heartbeat:
            print("\nSuccess! Connected to drone")
            print(f"Vehicle type: {master.flightmode}")
            print(f"System status: {master.system_status}")
            print("\nStarting to receive messages...\n")
            
            while True:
                # Try to get any message
                msg = master.recv_match(blocking=True, timeout=1)
                if msg is not None:
                    # Filter out heartbeat messages to reduce noise
                    msg_type = msg.get_type()
                    if msg_type != 'HEARTBEAT':
                        print(f"Message Type: {msg_type}")
                        print(f"Message: {msg.to_dict()}")
                        print("-" * 50)
                
                time.sleep(0.1)  # Small delay
        else:
            print("\nFailed to receive heartbeat!")
            print("Please check your telemetry connection and try again")
            
    except KeyboardInterrupt:
        print("\nProgram stopped by user")
    except Exception as e:
        print(f"\nError: {str(e)}")
        print("This might be due to:")
        print("1. Wrong baud rate (try 57600 or 115200)")
        print("2. Permission issues (try running with sudo)")
        print("3. Telemetry module not properly connected")
    finally:
        try:
            master.close()
        except:
            pass

if __name__ == "__main__":
    main() 