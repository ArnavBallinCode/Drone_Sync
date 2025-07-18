from pymavlink import mavutil

# Connect to flight controller
master = mavutil.mavlink_connection('/dev/tty.usbserial-D30JKVZM', baud=57600)

print("Waiting for heartbeat...")
master.wait_heartbeat()
print(f"Heartbeat received from system {master.target_system}, component {master.target_component}")

# Send gyro calibration command
command = mavutil.mavlink.MAV_CMD_PREFLIGHT_CALIBRATION
master.mav.command_long_send(
    master.target_system,
    master.target_component,
    command,
    0,
    1, 0, 0, 0, 0, 0, 0  # Only gyro
)
print("Gyro calibration command sent. Waiting for ACK...")

# Wait for command acknowledgment
ack = master.recv_match(type='COMMAND_ACK', blocking=True, timeout=10)
if ack and ack.command == command:
    result = mavutil.mavlink.enums['MAV_RESULT'][ack.result].description
    print(f"ACK received: {result}")
    if ack.result == mavutil.mavlink.MAV_RESULT_ACCEPTED:
        print("✅ Calibration command accepted. Listening for status updates...")
    else:
        print("❌ Calibration command not accepted.")
else:
    print("❌ No ACK received.")
    exit()

# Now listen for STATUSTEXT messages to confirm calibration
while True:
    msg = master.recv_match(type='STATUSTEXT', blocking=True, timeout=15)
    if not msg:
        print("❌ No status update received.")
        break

    text = msg.text.lower()
    print(f"Status: {msg.text}")

    if "gyro" in text and ("done" in text or "complete" in text):
        print("✅ Gyro calibration completed successfully.")
        break
    elif "gyro" in text and "fail" in text:
        print("❌ Gyro calibration failed.")
        break
