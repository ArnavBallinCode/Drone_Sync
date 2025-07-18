from pymavlink import mavutil

# Adjust port and baudrate as per your setup
master = mavutil.mavlink_connection('/dev/tty.usbserial-D30JKVZM', baud=57600)

# Wait for heartbeat before sending commands
master.wait_heartbeat()
print("Heartbeat received from system (system %u component %u)" % (master.target_system, master.target_component))

# Send the compass calibration command (MAV_CMD_DO_START_MAG_CAL = 42424)
master.mav.command_long_send(
    master.target_system,
    master.target_component,
    42424,      # MAV_CMD_DO_START_MAG_CAL
    0,          # Confirmation
    0, 0, 0, 0, 0, 0, 0
)

print("Compass calibration command sent!")
