from pymavlink import mavutil
import time

UDP_PORT = 14551  # your MAVLink UDP port
CONNECTION_STRING = f"udpin:localhost:{UDP_PORT}"

def get_firmware_version():
    # Connect to the drone via UDP
    master = mavutil.mavlink_connection(CONNECTION_STRING)
    print(f"Connecting to {CONNECTION_STRING}...")

    # Wait for the first heartbeat to find system IDs
    print("Waiting for heartbeat...")
    master.wait_heartbeat()
    print(f"Heartbeat from system (system {master.target_system} component {master.target_component})")

    # Request autopilot version
    master.mav.command_long_send(
        master.target_system,
        master.target_component,
        mavutil.mavlink.MAV_CMD_REQUEST_AUTOPILOT_CAPABILITIES,
        0,
        1, 0, 0, 0, 0, 0, 0
    )

    print("Requesting autopilot version...")
    start_time = time.time()
    timeout = 5  # seconds

    while time.time() - start_time < timeout:
        msg = master.recv_match(type='AUTOPILOT_VERSION', blocking=True, timeout=1)
        if msg:
            print("Firmware version info received:")
            print(f"  Flight Software Version: {msg.flight_sw_version}")
            print(f"  Middleware Software Version: {msg.middleware_sw_version}")
            print(f"  OS Software Version: {msg.os_sw_version}")
            print(f"  Vendor ID: {msg.vendor_id}")
            print(f"  Product ID: {msg.product_id}")
            print(f"  Flight Custom Version: {msg.flight_custom_version}")
            print(f"  Middleware Custom Version: {msg.middleware_custom_version}")
            print(f"  OS Custom Version: {msg.os_custom_version}")
            return

    print("Failed to receive firmware version message within timeout.")

if __name__ == "__main__":
    get_firmware_version()
