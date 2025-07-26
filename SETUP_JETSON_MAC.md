# DroneSync GCS: Jetson/Mac Integration Setup Guide

## 1. Generate SSH Key for Passwordless SCP

On your GCS/server (not Jetson):
```sh
ssh-keygen -t rsa -b 4096 -f ~/.ssh/test_mac_key -N "" -C "test_mac_connection"
```

## 2. Copy SSH Key to Jetson or Mac

If using Jetson:
```sh
ssh-copy-id -i ~/.ssh/test_mac_key.pub jetson@<JETSON_IP>
```
If using Mac (with password):
```sh
brew install sshpass
sshpass -p "<password>" ssh-copy-id -i ~/.ssh/test_mac_key.pub arnavangarkar@192.168.1.4
```

## 3. Prepare Data Files on Jetson/Mac

On Jetson/Mac, create the data files:
```sh
mkdir -p ~/safe_spots
nano ~/safe_spots/safe_spots.txt
nano ~/safe_spots/events.txt
```

Example `safe_spots.txt`:
```
Arena:
Corner1: [37.7749, -122.4194]
Corner2: [37.7749, -122.4144]
Corner3: [37.7699, -122.4144]
Corner4: [37.7699, -122.4194]

Detected Safe Spots
SafeSpots:
Spot1: [37.7730, -122.4180]
Spot2: [37.7720, -122.4170]
Spot3: [37.7710, -122.4160]
```

Example `events.txt`:
```
Drone Status: Flying
Battery: 92%
Lock: Active
Altitude: 145m
Speed: 18 m/s
Temperature: 24°C
Signal Strength: Excellent
Mission: Safe spot scanning complete
Last Update: <date>
System: All sensors operational
```

## 4. Update API Route Configs

In `/app/api/jetson-data/route.ts`:
```ts
const JETSON_CONFIG = {
  ip: '192.168.1.4',
  username: 'arnavangarkar',
  remotePath: '/Users/arnavangarkar/safe_spots/safe_spots.txt',
  localPath: path.join(process.cwd(), 'temp', 'safe_zone_data.txt')
}
```

In `/app/api/status-text/route.ts`:
```ts
const JETSON_USER = 'arnavangarkar';
const JETSON_HOST = '192.168.1.4';
const REMOTE_PATH = '/Users/arnavangarkar/safe_spots/events.txt';
const LOCAL_PATH = path.join(process.cwd(), 'public', 'params', 'status.txt');
```

Both routes use:
```sh
scp -i ~/.ssh/test_mac_key ...
```

## 5. Start Next.js Server

```sh
npm run dev
```

## 6. Test API Endpoints

```sh
curl -s http://localhost:3000/api/jetson-data | jq .
curl -s http://localhost:3000/api/status-text | jq .
```

## 7. Update Data Files Manually

Edit `safe_spots.txt` and `events.txt` on Jetson/Mac to test live updates. Dashboard will auto-refresh every 3-5 seconds.

---

**Summary:**
- SSH key setup for passwordless SCP
- Data files in correct format
- API route configs for Jetson/Mac
- Manual file editing for live dashboard testing
- All commands and steps above
