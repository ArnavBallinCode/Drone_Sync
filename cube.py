import serial.tools.list_ports
from pymavlink import mavutil
import time
import csv
import math
from datetime import datetime
import os

def list_serial_ports():
    print("Available Serial Ports:")
    ports = list(serial.tools.list_ports.comports())
    if not ports:
        print("No COM ports found.")
        return None

    for idx, port in enumerate(ports):
        print(f"{idx + 1}: {port.device} - {port.description}")

    choice = input("Enter the port number to connect (e.g., 1): ")
    try:
        port_index = int(choice) - 1
        return ports[port_index].device
    except:
        print("Invalid selection.")
        return None

def connect_to_cube(port_name):
    print(f"Connecting to Cube+ on {port_name}...")
    try:
        master = mavutil.mavlink_connection(port_name, baud=57600)
        master.wait_heartbeat()
        print(f"Connected to system {master.target_system}, component {master.target_component}")

        master.mav.request_data_stream_send(
            master.target_system,
            master.target_component,
            mavutil.mavlink.MAV_DATA_STREAM_ALL,
            10,
            1
        )
        return master
    except Exception as e:
        print(f"Failed to connect: {e}")
        return None

def parse_and_log_messages(master):
    print("Receiving MAVLink data every 2 seconds and logging to CSV...")

    # Ensure folder exists
    log_folder = r"C:\drone data logger"
    os.makedirs(log_folder, exist_ok=True)

    # CSV file path
    filename = os.path.join(log_folder, f"cube_log_{datetime.now().strftime('%Y%m%d_%H%M%S%.f')}.csv")

    with open(filename, mode='w', newline='') as file:
        writer = csv.writer(file)
        writer.writerow([
            "Timestamp",
            "Roll (deg)", "Pitch (deg)", "Yaw (deg)",
            "Omega X (deg/s)", "Omega Y (deg/s)", "Omega Z (deg/s)",
            "Position X (m)", "Position Y (m)", "Position Z (m)",           
            "Velocity X (m/s)", "Velocity Y (m/s)", "Velocity Z (m/s)",
            "Altitude (m)", "Heading (deg)",
            "Battery Voltage (V)"
        ])

        last_time = 0
        roll = pitch = yaw = None
        omega_x = omega_y = omega_z = None
        x = y = z = None        
        voltage = None
        altitude = None
        vx = vy = vz = None     
        heading_deg = heading = None

        try:
            while True:
                msg = master.recv_match(blocking=True)
                if not msg:
                    continue

                now = time.time()

                if msg.get_type() == "AHRS2":
                    roll = msg.roll
                    pitch = msg.pitch       
                    yaw = msg.yaw
                
                elif msg.get_type() == "ATTITUDE":
                    omega_x = msg.rollspeed
                    omega_y = msg.pitchspeed
                    omega_z = msg.yawspeed

                elif msg.get_type() == "LOCAL_POSITION_NED":
                    x = msg.x
                    y = msg.y
                    z = msg.z
                    vx = msg.vx
                    vy = msg.vy
                    vz = msg.vz
                elif msg.get_type() == "RANGEFINDER":
                    altitude = msg.distance  # Convert cm to m

                elif msg.get_type() == "SYS_STATUS":
                    voltage = msg.voltage_battery / 1000.0  # Convert mV to V

                elif msg.get_type() == "VFR_HUD":
                    heading = msg.heading

                if now - last_time >= 0.5 and roll is not None and x is not None and heading is not None:
                    last_time = now
                    timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')

                    # --- Compute compass heading ---
                    try:
                        heading_deg = heading
                    except:
                        heading_deg = None
                    
                    # --- Print to terminal ---
                    print(f"\n[{timestamp}]")
                    print(f"  Angles     → Roll: {roll:.3f}°, Pitch: {pitch:.3f}°, Yaw: {yaw:.3f}°")
                    print(f"  Angular Rates    → Roll: {omega_x:.3f}°, Pitch: {omega_y:.3f}°, Yaw: {omega_z:.3f}°")
                    print(f"  Local Position → X: {x:.3f}°, Y: {y:.3f}°, Z: {z:.3f}°")
                    print(f"  Velocity      → Vx: {vx:.3f}°, Vy: {vy:.3f}°, Vz: {vz:.3f}°")
                    print(f"  Altitude     → {altitude:.3f} m")
                    print(f"  Battery      → Voltage: {voltage:.3f} V")
                    print(f"  Heading → {heading_deg:.3f}°")

                    # --- Write to CSV ---
                    writer.writerow([
                        timestamp,
                        round(roll, 3), round(pitch, 3), round(yaw, 3),
                        round(omega_x, 3), round(omega_y, 3), round(omega_z, 3),
                        round(x, 4),round(y, 4),round(z, 4),
                        round(vx, 4), round(vy, 3), round(vz, 3),
                        round(altitude, 4),
                        heading_deg,
                        voltage
                    ])
                    file.flush()

        except KeyboardInterrupt:
            print("\nStopped by user.")
        except Exception as e:
            print(f"Error while logging: {e}")

if __name__ == "__main__":
    selected_port = list_serial_ports()
    if selected_port:
        mavlink_conn = connect_to_cube(selected_port)
        if mavlink_conn:
            parse_and_log_messages(mavlink_conn)
     
