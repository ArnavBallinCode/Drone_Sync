import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';

const execAsync = promisify(exec);

// Jetson SCP config
const JETSON_USER = 'jetson';
const JETSON_HOST = '192.168.1.100'; // Change to your Jetson IP
const REMOTE_PATH = '/home/jetson/status.txt';
const LOCAL_PATH = path.join(process.cwd(), 'public', 'params', 'status.txt');

export async function GET() {
    try {
        // Fetch status.txt from Jetson using SCP
        await execAsync(`scp ${JETSON_USER}@${JETSON_HOST}:${REMOTE_PATH} ${LOCAL_PATH}`);
        // Read the file
        const fs = require('fs');
        const statusText = fs.readFileSync(LOCAL_PATH, 'utf-8');
        return NextResponse.json({ status: 'success', data: statusText });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message });
    }
}
