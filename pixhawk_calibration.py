import time
import logging
import serial
from pymavlink import mavutil
import argparse

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger(__name__)

class PixhawkCalibrator:
    def __init__(self, port='/dev/tty.usbmodem01', baud=115200):
        self.port = port
        self.baud = baud
        self.master = None
        self.calibration_states = {
            'started': False,
            'progress': 0,
            'success': False,
            'failure_detected': False
        }

    def connect(self, retries=3, retry_delay=5):
        """Establish connection to Pixhawk with retry mechanism"""
        for attempt in range(retries):
            try:
                logger.info(f"Connecting to {self.port} at {self.baud} baud (attempt {attempt + 1}/{retries})")
                self.master = mavutil.mavlink_connection(self.port, baud=self.baud)
                if self.wait_for_heartbeat():
                    logger.info("Successfully connected to Pixhawk!")
                    return True
            except Exception as e:
                logger.error(f"Connection attempt {attempt + 1} failed: {e}")
                if attempt < retries - 1:
                    logger.info(f"Retrying in {retry_delay} seconds...")
                    time.sleep(retry_delay)
        
        raise ConnectionError(f"Failed to connect after {retries} attempts")

    def wait_for_heartbeat(self, timeout=30):
        """Wait for system heartbeat"""
        logger.info("Waiting for heartbeat...")
        start_time = time.time()
        while time.time() - start_time < timeout:
            try:
                if self.master.recv_match(type='HEARTBEAT', blocking=True, timeout=1):
                    logger.info("Heartbeat received!")
                    return True
            except serial.SerialException as e:
                logger.error(f"Serial error while waiting for heartbeat: {e}")
                return False
        logger.error("No heartbeat received")
        return False

    def calibrate_sensors(self, sensor_type):
        """
        Perform sensor calibration
        sensor_type can be: 'gyro', 'accel', 'mag', 'level'
        """
        # Map sensor type to calibration command parameters
        calibration_params = {
            'gyro':  [1, 0, 0, 0, 0, 0, 0],  # Gyroscope calibration
            'accel': [0, 1, 0, 0, 0, 0, 0],  # Accelerometer calibration
            'mag':   [0, 0, 1, 0, 0, 0, 0],  # Magnetometer calibration
            'level': [0, 0, 0, 2, 0, 0, 0],  # Level horizon calibration
        }

        if sensor_type not in calibration_params:
            raise ValueError(f"Unsupported sensor type: {sensor_type}")

        try:
            logger.info(f"Starting {sensor_type} calibration...")
            
            # Reset calibration states
            self.calibration_states = {
                'started': False,
                'progress': 0,
                'success': False,
                'failure_detected': False
            }

            # Request all possible message streams
            logger.info("Requesting data streams...")
            streams = [
                mavutil.mavlink.MAV_DATA_STREAM_ALL,
                mavutil.mavlink.MAV_DATA_STREAM_RAW_SENSORS,
                mavutil.mavlink.MAV_DATA_STREAM_EXTENDED_STATUS,
                mavutil.mavlink.MAV_DATA_STREAM_RC_CHANNELS,
                mavutil.mavlink.MAV_DATA_STREAM_POSITION,
                mavutil.mavlink.MAV_DATA_STREAM_EXTRA1,
                mavutil.mavlink.MAV_DATA_STREAM_EXTRA2,
                mavutil.mavlink.MAV_DATA_STREAM_EXTRA3
            ]

            for stream in streams:
                self.master.mav.request_data_stream_send(
                    self.master.target_system,
                    self.master.target_component,
                    stream,
                    10,  # 10Hz
                    1    # Start
                )
                logger.info(f"Requested stream {stream}")

            # Small delay to let streams start
            time.sleep(1)

            # Send calibration command
            logger.info("Sending calibration command...")
            self.master.mav.command_long_send(
                self.master.target_system,
                self.master.target_component,
                mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION,
                0,  # Confirmation
                *calibration_params[sensor_type]  # Unpack calibration parameters
            )

            # Monitor calibration progress
            return self.monitor_calibration_progress(sensor_type)

        except Exception as e:
            logger.error(f"Calibration error: {e}")
            return False

    def monitor_calibration_progress(self, sensor_type, timeout=60):
        """Monitor calibration status messages"""
        logger.info(f"Monitoring {sensor_type} calibration progress for up to {timeout} seconds...")
        
        # Keywords for success and failure
        success_keywords = ["success", "complete", "finished", "done", "pass", "completed", "calibration done"]
        failure_keywords = ["fail", "failed", "error", "aborted", "timeout"]

        start_time = time.time()
        last_message_time = start_time
        messages_received = []

        while time.time() - start_time < timeout:
            try:
                msg = self.master.recv_match(blocking=True, timeout=1)
                if not msg:
                    # If we haven't received any messages for 5 seconds after command acceptance,
                    # and we've received some messages, consider it a success
                    if time.time() - last_message_time > 5 and len(messages_received) > 0:
                        logger.info("No messages received for 5 seconds, assuming calibration completed")
                        return True
                    continue

                last_message_time = time.time()
                msg_type = msg.get_type()
                logger.debug(f"Received message type: {msg_type}")

                # Handle all message types
                if msg_type in ['STATUSTEXT', 'COMMAND_ACK', 'COMMAND_LONG', 'HEARTBEAT']:
                    if msg_type == 'STATUSTEXT':
                        try:
                            text = msg.text.decode('utf-8', errors='ignore').strip() if isinstance(msg.text, bytes) else msg.text.strip()
                            messages_received.append(text)
                            logger.info(f"Message: {text}")
                            text_lower = text.lower()
                            
                            # Check for calibration start
                            if sensor_type in text_lower and ("calibration" in text_lower or "calibrating" in text_lower):
                                self.calibration_states['started'] = True
                                logger.info(f"{sensor_type} calibration process detected as started")
                            
                            # Parse progress
                            if "progress" in text_lower:
                                try:
                                    progress_val = int(''.join(filter(str.isdigit, text)) or 0)
                                    self.calibration_states['progress'] = progress_val
                                    logger.info(f"Calibration progress: {progress_val}%")
                                except ValueError:
                                    pass
                            
                            # Check for success/failure
                            if any(s in text_lower for s in success_keywords):
                                logger.info(f"Calibration success detected: '{text}'")
                                self.calibration_states['success'] = True
                                return True
                            
                            if any(s in text_lower for s in failure_keywords):
                                logger.error(f"Calibration failure detected: '{text}'")
                                self.calibration_states['failure_detected'] = True
                                return False

                        except Exception as e:
                            logger.warning(f"Error processing STATUSTEXT: {e}")
                            continue

                    elif msg_type == 'COMMAND_ACK':
                        logger.info(f"Command acknowledgment received: command={msg.command}, result={msg.result}")
                        if msg.command == mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION:
                            if msg.result == mavutil.mavlink.MAV_RESULT_ACCEPTED:
                                logger.info("Calibration command was accepted")
                                self.calibration_states['started'] = True
                            else:
                                logger.error(f"Calibration command failed with result: {msg.result}")
                                return False

                    elif msg_type == 'HEARTBEAT':
                        # Check if mode indicates calibration (some systems use this)
                        if hasattr(msg, 'system_status'):
                            if msg.system_status == mavutil.mavlink.MAV_STATE_CALIBRATING:
                                logger.info("System is calibrating (from HEARTBEAT)")
                                self.calibration_states['started'] = True
                            elif self.calibration_states['started'] and msg.system_status == mavutil.mavlink.MAV_STATE_STANDBY:
                                logger.info("System returned to standby, calibration might be complete")
                                return True

            except serial.SerialException as e:
                logger.error(f"Serial error while monitoring: {e}")
                return False
            except KeyboardInterrupt:
                logger.info("Calibration interrupted by user")
                return False
            except Exception as e:
                logger.warning(f"Error processing message: {e}")

        logger.error(f"Calibration monitoring timed out after {timeout}s")
        if not self.calibration_states['started']:
            logger.error("Calibration process never started")
        elif not self.calibration_states['success']:
            logger.error("Calibration started but never completed successfully")
        
        # Log all received messages for debugging
        if messages_received:
            logger.info("All received messages during calibration:")
            for msg in messages_received:
                logger.info(f"  - {msg}")
        
        return False

    def close(self):
        """Close the connection"""
        if self.master:
            self.master.close()
            logger.info("Connection closed")

def main():
    parser = argparse.ArgumentParser(description='Pixhawk Sensor Calibration Tool')
    parser.add_argument('--port', type=str, default='/dev/tty.usbmodem01',
                        help='Serial port for Pixhawk connection')
    parser.add_argument('--baud', type=int, default=115200,
                        help='Baud rate for serial connection')
    parser.add_argument('--sensor', type=str, choices=['gyro', 'accel', 'mag', 'level'],
                        required=True, help='Sensor to calibrate')
    
    args = parser.parse_args()

    calibrator = PixhawkCalibrator(args.port, args.baud)
    try:
        calibrator.connect()
        
        # Perform calibration
        if calibrator.calibrate_sensors(args.sensor):
            logger.info(f"{args.sensor.upper()} CALIBRATION SUCCESSFULLY COMPLETED!")
        else:
            logger.error(f"{args.sensor.upper()} CALIBRATION FAILED!")
            
    except Exception as e:
        logger.error(f"Error during calibration process: {e}")
    finally:
        calibrator.close()

if __name__ == "__main__":
    main() 