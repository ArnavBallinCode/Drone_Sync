from pymavlink import mavutil

def main():
    port = '/dev/tty.usbserial-D30JKVZM'
    baud = 57600
    print(f"Connecting to {port} at {baud} baud...")
    master = mavutil.mavlink_connection(port, baud=baud)

    print("Waiting for heartbeat...")
    master.wait_heartbeat()
    print("Heartbeat received.")

    # Send the tune string using play_tune_send
    tune = "MFT200L16O2G"  # A short beep

    print("Sending beep tune...")
    master.mav.play_tune_send(
        master.target_system,
        master.target_component,
        tune.encode('utf-8')  # Ensure it's bytes
    )

    print("Tune command sent.")

if __name__ == "__main__":
    main()
