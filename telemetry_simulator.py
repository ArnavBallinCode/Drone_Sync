#!/usr/bin/env python3
"""
Simple telemetry simulator for Safe Spot Detection testing
Updates LOCAL_POSITION_NED.json with movement towards safe spots
"""

import json
import time
import math
import random

# Safe spot coordinates (from your safe-spots page)
SAFE_SPOTS = [
    {"name": "Safe Spot Alpha", "x": 3.5, "y": 6.5},
    {"name": "Safe Spot Beta", "x": 2.0, "y": 9.0},
    {"name": "Safe Spot Gamma", "x": 6.5, "y": 9.0},
    {"name": "Home Base", "x": 8.4, "y": 1.6}
]

# File path
JSON_FILE = "public/params/LOCAL_POSITION_NED.json"

class TelemetrySimulator:
    def __init__(self):
        self.current_x = -1.5  # Starting position from your current data
        self.current_y = 2.0
        self.current_z = -2.5
        self.time_boot_ms = 121363
        self.target_index = 0
        self.move_speed = 0.05  # meters per update
        
    def get_current_target(self):
        return SAFE_SPOTS[self.target_index]
    
    def move_towards_target(self):
        target = self.get_current_target()
        
        # Calculate direction to target
        dx = target["x"] - self.current_x
        dy = target["y"] - self.current_y
        
        # Calculate distance
        distance = math.sqrt(dx*dx + dy*dy)
        
        # If close to target, move to next safe spot
        if distance < 0.3:
            print(f"✅ Reached {target['name']} at ({self.current_x:.2f}, {self.current_y:.2f})")
            self.target_index = (self.target_index + 1) % len(SAFE_SPOTS)
            target = self.get_current_target()
            dx = target["x"] - self.current_x
            dy = target["y"] - self.current_y
            distance = math.sqrt(dx*dx + dy*dy)
        
        # Move towards target
        if distance > 0:
            self.current_x += (dx / distance) * self.move_speed
            self.current_y += (dy / distance) * self.move_speed
        
        # Add small random variations for realistic movement
        self.current_x += random.uniform(-0.01, 0.01)
        self.current_y += random.uniform(-0.01, 0.01)
        self.current_z += random.uniform(-0.005, 0.005)
        
        # Increment time
        self.time_boot_ms += random.randint(200, 300)
        
        print(f"Moving to {target['name']} - Position: ({self.current_x:.3f}, {self.current_y:.3f}) Distance: {distance:.2f}m")
    
    def generate_telemetry_data(self):
        # Calculate velocities (simple derivative)
        vx = random.uniform(-0.1, 0.1)
        vy = random.uniform(-0.1, 0.1)
        vz = random.uniform(-0.02, 0.02)
        
        return {
            "mavpackettype": "LOCAL_POSITION_NED",
            "time_boot_ms": self.time_boot_ms,
            "x": self.current_x,
            "y": self.current_y,
            "z": self.current_z,
            "vx": vx,
            "vy": vy,
            "vz": vz
        }
    
    def update_json_file(self):
        data = self.generate_telemetry_data()
        
        try:
            with open(JSON_FILE, 'w') as f:
                json.dump(data, f)
            return True
        except Exception as e:
            print(f"Error writing to file: {e}")
            return False

def main():
    print("🚁 Starting Telemetry Simulator for Safe Spot Detection")
    print("📍 Safe spots to visit:")
    for i, spot in enumerate(SAFE_SPOTS):
        print(f"   {i+1}. {spot['name']} at ({spot['x']}, {spot['y']})")
    print("Press Ctrl+C to stop\n")
    
    simulator = TelemetrySimulator()
    
    try:
        while True:
            # Move towards current target
            simulator.move_towards_target()
            
            # Update JSON file
            if simulator.update_json_file():
                pass  # File updated successfully
            else:
                print("❌ Failed to update JSON file")
            
            # Wait before next update
            time.sleep(0.5)  # Update every 500ms to match your page refresh rate
            
    except KeyboardInterrupt:
        print("\n🛑 Simulator stopped by user")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    main()
