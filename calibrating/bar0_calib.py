from pymavlink import mavutil
import time

def print_baro_data(master):
    print("Waiting for barometer data...")
    msg = master.recv_match(type='SCALED_PRESSURE', blocking=True, timeout=5)
    if msg:
        print(f"Pressure (mbar): {msg.press_abs}")
        print(f"Temperature (°C): {msg.temperature}")
        # Altitude field does not exist here, so skip it
    else:
        print("No barometer data received.")


def main():
    # Change this to your serial port and baudrate
    connection_string = "/dev/tty.usbserial-D30JKVZM"
    baud_rate = 57600

    print(f"Connecting to {connection_string} at {baud_rate} baud...")
    master = mavutil.mavlink_connection(connection_string, baud=baud_rate)

    print("Waiting for heartbeat...")
    master.wait_heartbeat()
    print(f"Heartbeat received from system {master.target_system}, component {master.target_component}")

    print("\n--- Barometer data BEFORE calibration ---")
    print_baro_data(master)

    # Send barometer calibration command (param3 = 2 for baro)
    master.mav.command_long_send(
        master.target_system,
        master.target_component,
        mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION,
        0,
        0, 0, 2, 0, 0, 0, 0
    )
    print("Barometer calibration command sent. Waiting 10 seconds for calibration...")
    time.sleep(10)

    print("\n--- Barometer data AFTER calibration ---")
    print_baro_data(master)

if __name__ == "__main__":
    main()
