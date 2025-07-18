from pymavlink import mavutil
import time

# Connection settings
SERIAL_PORT = "/dev/tty.usbmodem01"
BAUD_RATE = 57600

def monitor_height():
    try:
        # Connect to the drone
        print("Connecting to Pixhawk...")
        master = mavutil.mavlink_connection(SERIAL_PORT, baud=BAUD_RATE)
        
        # Wait for heartbeat
        print("Waiting for heartbeat...")
        master.wait_heartbeat(timeout=10)
        print("Connected!")
        print("\nMonitoring height from ground level...")
        print("(Press Ctrl+C to stop)")
        
        while True:
            # Get height data from ALTITUDE message
            msg = master.recv_match(type='ALTITUDE', blocking=True, timeout=1)
            
            if msg:
                # altitude_relative is height above home position in meters
                height = msg.altitude_relative
                print(f"Height above ground: {height:.2f}m")
            else:
                print("Waiting for height data...")
            
            time.sleep(5)  # Wait for 5 seconds before next reading
            
    except KeyboardInterrupt:
        print("\nProgram stopped by user")
    except Exception as e:
        print(f"Error: {str(e)}")
    finally:
        try:
            master.close()
        except:
            pass

if __name__ == "__main__":
    monitor_height() 