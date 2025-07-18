import socket
import threading
import time
import argparse
from pymavlink import mavutil

class MAVLinkProxy:
    def __init__(self, source_connection, local_port=14550, remote_port=14551):
        self.source = source_connection
        self.local_port = local_port
        self.remote_port = remote_port
        self.running = False
        
        # Create UDP socket for receiving remote connections
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        self.sock.bind(('0.0.0.0', local_port))
        self.remote_clients = set()
        
    def start(self):
        self.running = True
        
        # Start threads for receiving and forwarding
        self.receive_thread = threading.Thread(target=self._receive_from_source)
        self.forward_thread = threading.Thread(target=self._receive_from_clients)
        
        self.receive_thread.start()
        self.forward_thread.start()
        
        print(f"Proxy started - listening on port {self.local_port}")
        print(f"Remote clients will connect on port {self.remote_port}")
        
    def _receive_from_source(self):
        while self.running:
            try:
                msg = self.source.recv_match(blocking=True, timeout=1.0)
                if msg:
                    # Forward to all connected clients
                    msg_bytes = msg.get_msgbuf()
                    for client in self.remote_clients:
                        try:
                            self.sock.sendto(msg_bytes, client)
                        except:
                            self.remote_clients.remove(client)
            except Exception as e:
                print(f"Error receiving from source: {e}")
                time.sleep(1)
                
    def _receive_from_clients(self):
        while self.running:
            try:
                data, addr = self.sock.recvfrom(65535)
                if addr not in self.remote_clients:
                    print(f"New client connected: {addr}")
                    self.remote_clients.add(addr)
                # Forward to vehicle
                self.source.write(data)
            except Exception as e:
                print(f"Error receiving from clients: {e}")
                time.sleep(1)
    
    def stop(self):
        self.running = False
        self.receive_thread.join()
        self.forward_thread.join()
        self.sock.close()

def main():
    parser = argparse.ArgumentParser(description='MAVLink UDP Proxy')
    parser.add_argument('--source', type=str, required=True,
                      help='Source connection (e.g., /dev/ttyUSB0 or udp:localhost:14550)')
    parser.add_argument('--baud', type=int, default=57600,
                      help='Baud rate for serial connection')
    parser.add_argument('--local-port', type=int, default=14550,
                      help='Local UDP port for receiving connections')
    parser.add_argument('--remote-port', type=int, default=14551,
                      help='Remote UDP port for client connections')
    
    args = parser.parse_args()
    
    # Connect to the source (vehicle)
    if args.source.startswith('udp:'):
        source = mavutil.mavlink_connection(args.source)
    else:
        source = mavutil.mavlink_connection(args.source, baud=args.baud)
    
    # Create and start proxy
    proxy = MAVLinkProxy(source, args.local_port, args.remote_port)
    
    try:
        proxy.start()
        while True:
            time.sleep(1)
    except KeyboardInterrupt:
        print("\nStopping proxy...")
        proxy.stop()

if __name__ == "__main__":
    main() 