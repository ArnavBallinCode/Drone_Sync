from pymavlink import mavutil
import time
import statistics
import math

# Connection settings
SERIAL_PORT = "/dev/tty.usbmodem01"
BAUD_RATE = 57600

# Thresholds for calibration
BARO_VARIANCE_THRESHOLD = 1.0     # Increased threshold for barometer variance
GYRO_VARIANCE_THRESHOLD = 0.5    # Increased threshold for gyro to avoid false positives
BARO_DRIFT_THRESHOLD = 2.0       # Increased drift threshold to 2 meters
WINDOW_SIZE = 30                 # Increased window size for better averaging
MIN_SAMPLES_BEFORE_ALERT = 10    # Minimum samples needed before alerting

class SensorMonitor:
    def __init__(self):
        self.baro_readings = []
        self.gyro_readings = []
        self.initial_baro_height = None
        self.last_calibration_time = time.time()
        self.calibration_cooldown = 300  # 5 minutes between calibrations
        self.consecutive_alerts = 0      # Track consecutive alerts
        self.last_print_time = 0         # Track last status print
        self.calibration_in_progress = False

    def analyze_sensors(self, baro_height, gyro_x, gyro_y, gyro_z):
        if self.calibration_in_progress:
            return None
            
        current_time = time.time()
        
        # Add new readings
        self.baro_readings.append(baro_height)
        self.gyro_readings.append((gyro_x, gyro_y, gyro_z))

        # Keep only the last WINDOW_SIZE readings
        if len(self.baro_readings) > WINDOW_SIZE:
            self.baro_readings.pop(0)
        if len(self.gyro_readings) > WINDOW_SIZE:
            self.gyro_readings.pop(0)

        # Initialize reference height if not set
        if self.initial_baro_height is None and len(self.baro_readings) >= MIN_SAMPLES_BEFORE_ALERT:
            self.initial_baro_height = statistics.mean(self.baro_readings[:MIN_SAMPLES_BEFORE_ALERT])
            print(f"\nInitial height reference set to: {self.initial_baro_height:.2f}m")

        # Only analyze if we have enough samples
        if len(self.baro_readings) < MIN_SAMPLES_BEFORE_ALERT:
            return None

        issues = []

        # Analyze barometer with moving average
        recent_baro_avg = statistics.mean(self.baro_readings[-MIN_SAMPLES_BEFORE_ALERT:])
        if self.initial_baro_height is not None:
            baro_drift = abs(recent_baro_avg - self.initial_baro_height)
            if baro_drift > BARO_DRIFT_THRESHOLD:
                issues.append(f"Significant height drift: {baro_drift:.2f}m")

        # Analyze gyroscope with moving window
        recent_gyro = self.gyro_readings[-MIN_SAMPLES_BEFORE_ALERT:]
        max_gyro = max(max(abs(x), abs(y), abs(z)) for x, y, z in recent_gyro)
        if max_gyro > GYRO_VARIANCE_THRESHOLD:
            issues.append(f"High rotation detected: {max_gyro:.3f} rad/s")

        # Print status every 5 seconds if no issues
        if not issues and current_time - self.last_print_time > 5:
            print(f"\nAll sensors stable. Height: {recent_baro_avg:.2f}m, Max rotation: {max_gyro:.3f} rad/s")
            self.last_print_time = current_time

        # Update consecutive alerts
        if issues:
            self.consecutive_alerts += 1
        else:
            self.consecutive_alerts = 0

        # Only return issues if we've seen them multiple times
        return issues if self.consecutive_alerts >= 3 else None

    def should_calibrate(self):
        if self.calibration_in_progress:
            return False
        current_time = time.time()
        if current_time - self.last_calibration_time < self.calibration_cooldown:
            return False
        return self.consecutive_alerts >= 5  # Require 5 consecutive alerts before calibrating

    def calibrate_sensors(self, master):
        self.calibration_in_progress = True
        print("\n" + "="*50)
        print("STARTING SENSOR CALIBRATION")
        print("="*50)
        
        # Send barometer calibration command
        print("\nCalibrating barometer...")
        master.mav.command_long_send(
            master.target_system,
            master.target_component,
            mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION,
            0,  # confirmation
            0,  # gyro calibration
            0,  # mag calibration
            0,  # zero pressure
            1,  # baro calibration
            0,  # accelerometer calibration
            0,  # airspeed calibration
            0   # unused
        )
        
        time.sleep(2)
        print("Barometer calibration completed!")
        
        # Send gyro calibration command
        print("\nCalibrating gyroscope...")
        master.mav.command_long_send(
            master.target_system,
            master.target_component,
            mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION,
            0,  # confirmation
            1,  # gyro calibration
            0,  # mag calibration
            0,  # zero pressure
            0,  # baro calibration
            0,  # accelerometer calibration
            0,  # airspeed calibration
            0   # unused
        )
        
        time.sleep(5)
        print("Gyroscope calibration completed!")
        
        self.last_calibration_time = time.time()
        self.initial_baro_height = None
        self.baro_readings = []
        self.gyro_readings = []
        self.consecutive_alerts = 0
        
        print("\n" + "="*50)
        print("CALIBRATION COMPLETED SUCCESSFULLY")
        print("="*50 + "\n")
        self.calibration_in_progress = False

def main():
    try:
        # Connect to the drone
        print("Connecting to Pixhawk...")
        master = mavutil.mavlink_connection(SERIAL_PORT, baud=BAUD_RATE)
        
        # Wait for heartbeat
        print("Waiting for heartbeat...")
        master.wait_heartbeat(timeout=10)
        print("Connected!")
        
        monitor = SensorMonitor()
        print("\nMonitoring sensors...")
        print("Auto-calibration enabled - will calibrate automatically when needed")
        
        # Initialize variables
        current_baro_height = None
        current_gyro_x = None
        current_gyro_y = None
        current_gyro_z = None
        
        while True:
            # Get messages
            msg = master.recv_match(type=['ALTITUDE', 'ATTITUDE'], blocking=True, timeout=1)
            
            if msg is not None:
                msg_type = msg.get_type()
                
                if msg_type == 'ALTITUDE':
                    current_baro_height = msg.altitude_relative
                    
                elif msg_type == 'ATTITUDE':
                    current_gyro_x = msg.rollspeed
                    current_gyro_y = msg.pitchspeed
                    current_gyro_z = msg.yawspeed
                    
                    # Only analyze when we have both baro and gyro data
                    if current_baro_height is not None:
                        issues = monitor.analyze_sensors(
                            current_baro_height,
                            current_gyro_x,
                            current_gyro_y,
                            current_gyro_z
                        )
                        
                        if issues:
                            print("\nSensor issues detected:")
                            for issue in issues:
                                print(f"- {issue}")
                            
                            if monitor.should_calibrate():
                                monitor.calibrate_sensors(master)
            
            time.sleep(0.1)  # Small delay to prevent CPU overload
            
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
    main() 