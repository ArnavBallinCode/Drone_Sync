import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Jetson SCP config
const JETSON_USER = 'arnavangarkar';
const JETSON_HOST = '192.168.1.4'; // Your test Mac IP
const REMOTE_PATH = '/Users/arnavangarkar/safe_spots/events.txt';
const LOCAL_PATH = path.join(process.cwd(), 'public', 'params', 'status.txt');

export async function GET() {
    try {
        // Fetch status.txt from Jetson using SCP with SSH key
        await execAsync(`scp -i ~/.ssh/test_mac_key -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${JETSON_USER}@${JETSON_HOST}:${REMOTE_PATH} ${LOCAL_PATH}`);
        // Read the file
        const fs = require('fs');
        const statusText = fs.readFileSync(LOCAL_PATH, 'utf-8');
        return NextResponse.json({ status: 'success', data: statusText });
    } catch (error: any) {
        // Return mock data as fallback
        const mockEvents = `Drone Status: Flying (MOCK DATA)
Battery: 85%
GPS Lock: Active
Altitude: 120m
Speed: 15 m/s
Temperature: 25°C
Signal Strength: Strong
Mission: Scanning safe spots
Last Update: ${new Date().toLocaleString()}
Error: ${error.message}`;

        return NextResponse.json({
            status: 'success',
            data: mockEvents,
            note: 'Using mock data due to connection error'
        });
    }
}