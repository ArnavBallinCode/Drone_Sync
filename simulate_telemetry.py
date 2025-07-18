#!/usr/bin/env python3
"""
Telemetry Simulator for Safe Spot Detection Testing
This script simulates drone movement by updating the local_position_ned.json file
The drone will move through various patterns and visit all safe spots for testing
"""

import json
import time
import math
import random
import os
from datetime import datetime

class TelemetrySimulator:
    def __init__(self):
        # File paths
        self.params_dir = "params"
        self.local_pos_file = os.path.join(self.params_dir, "local_position_ned.json")
        self.global_pos_file = os.path.join(self.params_dir, "global_position_int.json")
        
        # Safe spot coordinates (from your diagram)
        self.safe_spots = [
            {"name": "Safe Spot Alpha", "x": -1.0, "y": 0.5},    # 3.5, 6.5 in field coords
            {"name": "Safe Spot Beta", "x": -2.5, "y": 3.0},     # 2.0, 9.0 in field coords  
            {"name": "Safe Spot Gamma", "x": 2.0, "y": 3.0},     # 6.5, 9.0 in field coords
            {"name": "Home Base", "x": 3.9, "y": -4.4}           # 8.4, 1.6 in field coords
        ]
        
        # Current state
        self.current_x = 0.0
        self.current_y = 0.0
        self.current_z = -0.5  # Slightly above ground
        self.time_boot_ms = 0
        self.current_target = 0
        self.movement_speed = 0.1  # meters per update
        self.update_interval = 0.25  # 250ms updates (4Hz)
        
        # Movement patterns
        self.patterns = [
            "visit_safe_spots",
            "circular_patrol", 
            "random_walk",
            "figure_eight"
        ]
        self.current_pattern = 0
        self.pattern_timer = 0
        self.pattern_duration = 30  # seconds per pattern
        
        print("🚁 Telemetry Simulator Started")
        print(f"📁 Updating files: {self.local_pos_file}")
        print(f"🎯 Safe spots: {len(self.safe_spots)} targets")
        print("=" * 50)

    def update_time(self):
        """Update boot time"""
        self.time_boot_ms += int(self.update_interval * 1000)

    def visit_safe_spots_pattern(self):
        """Move to each safe spot in sequence"""
        target = self.safe_spots[self.current_target]
        target_x, target_y = target["x"], target["y"]
        
        # Calculate direction to target
        dx = target_x - self.current_x
        dy = target_y - self.current_y
        distance = math.sqrt(dx*dx + dy*dy)
        
        if distance < 0.3:  # Close enough to target
            print(f"✅ Reached {target['name']} at ({target_x:.2f}, {target_y:.2f})")
            self.current_target = (self.current_target + 1) % len(self.safe_spots)
            time.sleep(2)  # Pause at safe spot
        else:
            # Move toward target
            if distance > 0:
                self.current_x += (dx / distance) * self.movement_speed
                self.current_y += (dy / distance) * self.movement_speed
            print(f"🎯 Moving to {target['name']} - Distance: {distance:.2f}m")

    def circular_patrol_pattern(self):
        """Move in a circular pattern around the field center"""
        center_x, center_y = 0.0, 0.0
        radius = 3.0
        angular_speed = 0.02
        
        angle = (self.pattern_timer * angular_speed) % (2 * math.pi)
        self.current_x = center_x + radius * math.cos(angle)
        self.current_y = center_y + radius * math.sin(angle)
        
        print(f"🔄 Circular patrol - Angle: {math.degrees(angle):.1f}°")

    def random_walk_pattern(self):
        """Random movement within bounds"""
        # Add random movement
        self.current_x += random.uniform(-0.2, 0.2)
        self.current_y += random.uniform(-0.2, 0.2)
        
        # Keep within reasonable bounds (-5 to 5 meters)
        self.current_x = max(-5, min(5, self.current_x))
        self.current_y = max(-5, min(5, self.current_y))
        
        print(f"🎲 Random walk - Position: ({self.current_x:.2f}, {self.current_y:.2f})")

    def figure_eight_pattern(self):
        """Move in a figure-8 pattern"""
        t = self.pattern_timer * 0.1
        self.current_x = 2 * math.sin(t)
        self.current_y = math.sin(2 * t)
        
        print(f"∞ Figure-8 pattern - t: {t:.2f}")

    def update_position(self):
        """Update position based on current movement pattern"""
        pattern_name = self.patterns[self.current_pattern]
        
        if pattern_name == "visit_safe_spots":
            self.visit_safe_spots_pattern()
        elif pattern_name == "circular_patrol":
            self.circular_patrol_pattern()
        elif pattern_name == "random_walk":
            self.random_walk_pattern()
        elif pattern_name == "figure_eight":
            self.figure_eight_pattern()
        
        # Switch patterns periodically
        self.pattern_timer += self.update_interval
        if self.pattern_timer >= self.pattern_duration:
            self.pattern_timer = 0
            self.current_pattern = (self.current_pattern + 1) % len(self.patterns)
            print(f"\n🔄 Switching to pattern: {self.patterns[self.current_pattern]}\n")

    def generate_velocities(self):
        """Generate realistic velocity values"""
        # Add some noise to velocities
        vx = random.uniform(-0.1, 0.1)
        vy = random.uniform(-0.1, 0.1) 
        vz = random.uniform(-0.05, 0.05)
        return vx, vy, vz

    def update_local_position_ned(self):
        """Update the local_position_ned.json file"""
        vx, vy, vz = self.generate_velocities()
        
        data = {
            "mavpackettype": "LOCAL_POSITION_NED",
            "time_boot_ms": self.time_boot_ms,
            "x": round(self.current_x, 6),
            "y": round(self.current_y, 6), 
            "z": round(self.current_z, 6),
            "vx": round(vx, 6),
            "vy": round(vy, 6),
            "vz": round(vz, 6)
        }
        
        try:
            with open(self.local_pos_file, 'w') as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            print(f"❌ Error writing local position: {e}")

    def update_global_position_int(self):
        """Update the global_position_int.json file with corresponding GPS data"""
        # Convert local coordinates to simulated GPS coordinates
        # Using arbitrary base coordinates for simulation
        base_lat = 37774900  # San Francisco area (in 1e7 degrees)
        base_lon = -122419400
        
        # Convert meters to GPS degrees (very rough approximation)
        lat_offset = int(self.current_y * 89.83)  # ~111m per degree
        lon_offset = int(self.current_x * 111.32)
        
        data = {
            "mavpackettype": "GLOBAL_POSITION_INT", 
            "time_boot_ms": self.time_boot_ms,
            "lat": base_lat + lat_offset,
            "lon": base_lon + lon_offset,
            "alt": int(self.current_z * 1000) + 260,  # Convert to mm
            "relative_alt": int(-self.current_z * 1000) + 1698,
            "vx": 0,
            "vy": 0, 
            "vz": -2,
            "hdg": 2810
        }
        
        try:
            with open(self.global_pos_file, 'w') as f:
                json.dump(data, f, indent=4)
        except Exception as e:
            print(f"❌ Error writing global position: {e}")

    def print_status(self):
        """Print current status"""
        pattern = self.patterns[self.current_pattern]
        target = self.safe_spots[self.current_target]
        
        print(f"📍 Pos: ({self.current_x:6.2f}, {self.current_y:6.2f}) | "
              f"Pattern: {pattern:15} | "
              f"Target: {target['name']:15} | "
              f"Time: {self.time_boot_ms:6}ms")

    def run(self):
        """Main simulation loop"""
        try:
            print("🚀 Starting telemetry simulation...")
            print("⌨️  Press Ctrl+C to stop\n")
            
            while True:
                # Update time
                self.update_time()
                
                # Update position based on current pattern
                self.update_position()
                
                # Write to JSON files
                self.update_local_position_ned()
                self.update_global_position_int()
                
                # Print status every few updates
                if self.time_boot_ms % 2000 < self.update_interval * 1000:
                    self.print_status()
                
                # Sleep until next update
                time.sleep(self.update_interval)
                
        except KeyboardInterrupt:
            print("\n\n🛑 Simulation stopped by user")
            print("📊 Final position: ({:.2f}, {:.2f})".format(self.current_x, self.current_y))
            print("⏱️  Total runtime: {:.1f} seconds".format(self.time_boot_ms / 1000))
        except Exception as e:
            print(f"\n❌ Simulation error: {e}")

def main():
    """Main function"""
    print("🛡️  Safe Spot Detection - Telemetry Simulator")
    print("=" * 50)
    
    # Create params directory if it doesn't exist
    os.makedirs("params", exist_ok=True)
    
    # Initialize and run simulator
    simulator = TelemetrySimulator()
    simulator.run()

if __name__ == "__main__":
    main()
