import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Jetson SCP config
const JETSON_USER = 'ses';
const JETSON_HOST = '10.0.8.81'; // Correct Jetson IP
const REMOTE_PATH = '/home/ses/Desktop/safe_spots/events.txt';
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
        // Return error status without any data - let frontend handle gracefully
        return NextResponse.json({
            status: 'error'
        });
    }
}