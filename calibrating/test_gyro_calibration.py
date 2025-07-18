import time
import logging
import re
import serial
from pymavlink import mavutil
import sys

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

# Constants
CONNECTION_RETRIES = 3
RETRY_DELAY = 5
CALIBRATION_TIMEOUT = 120
DEFAULT_BAUD = 57600

class CalibrationError(Exception):
    """Custom exception for calibration failures"""
    pass

def connect_to_pixhawk(port: str, baud: int = DEFAULT_BAUD) -> mavutil.mavfile:
    """Establish MAVLink connection with retries"""
    for attempt in range(1, CONNECTION_RETRIES + 1):
        try:
            logger.info(f"Connection attempt {attempt}/{CONNECTION_RETRIES} to {port}@{baud}")
            master = mavutil.mavlink_connection(port, baud=baud, autoreconnect=True)
            
            if master.wait_heartbeat(timeout=10):
                logger.info(f"Connected to system {master.target_system} component {master.target_component}")
                return master
                
        except serial.SerialException as e:
            logger.error(f"Serial error: {e}")
            if attempt < CONNECTION_RETRIES:
                logger.info(f"Retrying in {RETRY_DELAY}s...")
                time.sleep(RETRY_DELAY)
                
    raise CalibrationError("Connection failed after all retries")

def ensure_disarmed(master: mavutil.mavfile) -> None:
    """Ensure vehicle is disarmed before calibration"""
    logger.info("Checking arm status...")
    
    for _ in range(5):
        msg = master.recv_match(type='HEARTBEAT', blocking=True, timeout=2)
        if msg and (msg.base_mode & mavutil.mavlink.MAV_MODE_FLAG_SAFETY_ARMED):
            logger.warning("Vehicle is armed! Attempting disarm...")
            master.arducopter_disarm()
            master.motors_disarmed_wait()
            logger.info("Successfully disarmed")
            return
            
    logger.info("Vehicle confirmed disarmed")

def execute_gyro_calibration(master: mavutil.mavfile) -> None:
    """Execute gyro calibration with full state tracking"""
    logger.info("Initiating gyro calibration...")
    
    # Send calibration command with proper parameters
    master.mav.command_long_send(
        master.target_system,
        master.target_component,
        mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION,
        0,  # Confirmation
        1,  # Param1: Gyro calibration
        0,  # Param2: Magnetometer
        0,  # Param3: Ground pressure
        0,  # Param4: Radio
        0,  # Param5: Accelerometer
        0,  # Param6: Board orientation
        0   # Param7: Unused
    )
    
    # Verify command acknowledgment
    ack = master.recv_match(
        type='COMMAND_ACK',
        blocking=True,
        timeout=5
    )
    
    if not ack:
        raise CalibrationError("No response to calibration command")
        
    if ack.result != mavutil.mavlink.MAV_RESULT_ACCEPTED:
        raise CalibrationError(f"Command rejected: {ack.result}")
    
    logger.info("Calibration command accepted. Monitoring progress...")
    
    # Monitor calibration state
    start_time = time.time()
    progress_pattern = re.compile(
        r'calibrat(e|ing|ion).*gyro|progress|complete|success|done',
        re.IGNORECASE
    )
    error_pattern = re.compile(r'fail|error|abort|reject', re.IGNORECASE)

    while time.time() - start_time < CALIBRATION_TIMEOUT:
        msg = master.recv_match(timeout=1)
        if not msg:
            continue
            
        if msg.get_type() == 'STATUSTEXT':
            try:
                text = msg.text.decode('utf-8', errors='ignore').strip()
                logger.info(f"System Message: {text}")
                
                if error_pattern.search(text):
                    raise CalibrationError(f"Calibration failed: {text}")
                    
                if progress_pattern.search(text):
                    if any(x in text.lower() for x in ['complete', 'done', 'success']):
                        logger.info("Calibration successful!")
                        return
                        
            except UnicodeDecodeError:
                logger.warning("Received malformed status message")
                
        elif msg.get_type() == 'COMMAND_ACK':
            logger.debug(f"Command ACK: {msg.result}")
            
    raise CalibrationError("Calibration timeout")

def verify_sensor_health(master: mavutil.mavfile) -> bool:
    """Post-calibration sensor health check"""
    logger.info("Verifying sensor health...")
    
    try:
        msg = master.recv_match(
            type='SYS_STATUS',
            blocking=True,
            timeout=5
        )
        
        if not msg:
            logger.warning("No SYS_STATUS received")
            return False
            
        gyro_healthy = msg.onboard_control_sensors_health & mavutil.mavlink.MAV_SYS_STATUS_SENSOR_3D_GYRO
        logger.info(f"Gyro Health Status: {'OK' if gyro_healthy else 'ERROR'}")
        return bool(gyro_healthy)
        
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return False

def main():
    """Main calibration procedure"""
    port = '/dev/tty.usbserial-D30JKVZM'  # Update with your port
    
    try:
        # Establish connection
        master = connect_to_pixhawk(port)
        
        # Pre-calibration checks
        ensure_disarmed(master)
        
        # Execute calibration sequence
        execute_gyro_calibration(master)
        
        # Post-calibration verification
        if not verify_sensor_health(master):
            raise CalibrationError("Post-calibration health check failed")
            
        logger.info("Gyro calibration completed successfully!")

    except CalibrationError as e:
        logger.error(f"Calibration Failed: {e}")
        sys.exit(1)
    except KeyboardInterrupt:
        logger.info("Calibration aborted by user")
        sys.exit(1)
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        sys.exit(1)
    finally:
        if 'master' in locals():
            master.close()
            logger.info("Connection closed")

if __name__ == '__main__':
    main()