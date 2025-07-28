import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'

const execAsync = promisify(exec)

export async function POST(request: NextRequest) {
    try {
        console.log('Stopping telemetry processes...')

        // Kill all Python processes running listen.py
        try {
            await execAsync('pkill -f "python.*listen.py"')
            console.log('Killed listen.py processes')
        } catch (error) {
            console.log('No listen.py processes found or already stopped')
        }

        // Kill any MAVProxy processes
        try {
            await execAsync('pkill -f "mavproxy"')
            console.log('Killed MAVProxy processes')
        } catch (error) {
            console.log('No MAVProxy processes found')
        }

        return NextResponse.json({
            status: 'success',
            message: 'Telemetry processes stopped successfully'
        })

    } catch (error) {
        console.error('Error stopping telemetry processes:', error)
        return NextResponse.json({
            status: 'error',
            message: 'Failed to stop telemetry processes',
            error: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
