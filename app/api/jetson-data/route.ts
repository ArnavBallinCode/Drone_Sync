import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

const JETSON_CONFIG = {
  ip: '10.0.2.219',
  username: 'jetson123',
  remotePath: '/home/nvidia/safe_zone_data.txt',
  localPath: path.join(process.cwd(), 'temp', 'safe_zone_data.txt')
}

interface ArenaCorner {
  lat: number
  lng: number
}

interface SafeSpot {
  id: string
  lat: number
  lng: number
}

interface ParsedData {
  arena: ArenaCorner[]
  safeSpots: SafeSpot[]
  timestamp: string
  status: 'success' | 'error'
  error?: string
}

// Recommended frontend polling interval for this API: 5000 ms (5 seconds)
export const JETSON_FETCH_INTERVAL_MS = 5000;

/*
Expected format for /home/nvidia/safe_zone_data.txt:

Arena:
Corner1: [12.0345, 77.1234]
Corner2: [12.0345, 77.1265]
Corner3: [12.0315, 77.1265]
Corner4: [12.0315, 77.1234]

Detected Safe Spots
SafeSpots:
Spot1: [12.0331, 77.1245]
Spot2: [12.0320, 77.1255]
Spot3: [12.0330, 77.1239]

*/
// Ensure temp directory exists
async function ensureTempDir() {
  const tempDir = path.dirname(JETSON_CONFIG.localPath)
  try {
    await fs.access(tempDir)
  } catch {
    await fs.mkdir(tempDir, { recursive: true })
  }
}

// Parse the safe zone data file
function parseArenaData(content: string): ParsedData {
  try {
    const lines = content.split('\n').map(line => line.trim()).filter(line => line.length > 0)

    const arena: ArenaCorner[] = []
    const safeSpots: SafeSpot[] = []

    let currentSection = ''

    for (const line of lines) {
      if (line === 'Arena:') {
        currentSection = 'arena'
        continue
      } else if (line === 'Detected Safe Spots' || line === 'SafeSpots:') {
        currentSection = 'safespots'
        continue
      }

      // Parse coordinate lines
      const coordMatch = line.match(/^(Corner\d+|Spot\d+):\s*\[([0-9.-]+),\s*([0-9.-]+)\]/)
      if (coordMatch) {
        const [, name, lat, lng] = coordMatch
        const latNum = parseFloat(lat)
        const lngNum = parseFloat(lng)

        if (currentSection === 'arena') {
          arena.push({ lat: latNum, lng: lngNum })
        } else if (currentSection === 'safespots') {
          safeSpots.push({ id: name, lat: latNum, lng: lngNum })
        }
      }
    }

    return {
      arena,
      safeSpots,
      timestamp: new Date().toISOString(),
      status: 'success'
    }
  } catch (error) {
    return {
      arena: [],
      safeSpots: [],
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown parsing error'
    }
  }
}

// Fetch data from Jetson via SCP
async function fetchJetsonData(): Promise<ParsedData> {
  try {
    await ensureTempDir()

    // SCP command to fetch the file from Jetson
    const scpCommand = `scp -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${JETSON_CONFIG.username}@${JETSON_CONFIG.ip}:${JETSON_CONFIG.remotePath} ${JETSON_CONFIG.localPath}`

    console.log('Executing SCP command:', scpCommand)

    // Execute SCP command
    await execAsync(scpCommand)

    // Read the downloaded file
    const content = await fs.readFile(JETSON_CONFIG.localPath, 'utf-8')

    // Parse the content
    const parsedData = parseArenaData(content)

    // Clean up temp file
    try {
      await fs.unlink(JETSON_CONFIG.localPath)
    } catch (cleanupError) {
      console.warn('Failed to cleanup temp file:', cleanupError)
    }

    return parsedData
  } catch (error) {
    console.error('Error fetching Jetson data:', error)

    return {
      arena: [],
      safeSpots: [],
      timestamp: new Date().toISOString(),
      status: 'error',
      error: error instanceof Error ? error.message : 'Failed to fetch data from Jetson'
    }
  }
}

// GET endpoint
export async function GET(request: NextRequest) {
  try {
    const data = await fetchJetsonData()

    return NextResponse.json(data, {
      status: 200,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    })
  } catch (error) {
    console.error('API Error:', error)

    return NextResponse.json({
      arena: [],
      safeSpots: [],
      timestamp: new Date().toISOString(),
      status: 'error',
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST endpoint for testing with mock data
export async function POST(request: NextRequest) {
  try {
    const mockData = `Arena:
Corner1: [12.0315, 77.1234]
Corner2: [12.0345, 77.1234]
Corner3: [12.0345, 77.1265]
Corner4: [12.0315, 77.1265]

Detected Safe Spots
SafeSpots:
SafeSpot1: [12.0338, 77.1245]
SafeSpot2: [12.0338, 77.1263]
SafeSpot3: [12.0323, 77.1263]`

    const parsedData = parseArenaData(mockData)

    return NextResponse.json(parsedData, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      arena: [],
      safeSpots: [],
      timestamp: new Date().toISOString(),
      status: 'error',
      error: 'Mock data parsing failed'
    }, { status: 500 })
  }
}