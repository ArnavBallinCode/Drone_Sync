import { NextRequest, NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'

const execAsync = promisify(exec)

const JETSON_CONFIG = {
  ip: '10.0.8.81',
  username: 'ses',
  remotePath: '/home/ses/Desktop/safe_spots/safe_spots.txt',
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

interface DroneEvent {
  type: 'takeoff' | 'landing' | 'mission_start' | 'mission_complete' | 'emergency' | 'waypoint_reached'
  timestamp: string
  message: string
  coordinates?: { lat: number, lng: number }
}

interface ParsedData {
  arena: ArenaCorner[]
  safeSpots: SafeSpot[]
  dronePosition: { lat: number, lng: number }
  events: DroneEvent[]
  timestamp: string
  status: 'success' | 'error'
  error?: string
}

// Recommended frontend polling interval for this API: 1000 ms (1 second)
export const JETSON_FETCH_INTERVAL_MS = 1000;

/*
Expected format for /home/ses/Desktop/safe_spots/safe_spots.txt:

DronePosition: [0.0, 0.0]

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

Events:
Event1: takeoff | 2025-07-28T08:30:00.000Z | Drone taking off from base
Event2: waypoint_reached | 2025-07-28T08:31:00.000Z | Reached waypoint 1 at [12.0331, 77.1245]
Event3: mission_complete | 2025-07-28T08:32:00.000Z | Mission completed successfully

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
    const events: DroneEvent[] = []
    let dronePosition = { lat: 0.0, lng: 0.0 }

    let currentSection = ''

    for (const line of lines) {
      if (line.startsWith('DronePosition:')) {
        const posMatch = line.match(/DronePosition:\s*\[([0-9.-]+),\s*([0-9.-]+)\]/)
        if (posMatch) {
          dronePosition = { lat: parseFloat(posMatch[1]), lng: parseFloat(posMatch[2]) }
        }
        continue
      } else if (line === 'Arena:') {
        currentSection = 'arena'
        continue
      } else if (line === 'Detected Safe Spots' || line === 'SafeSpots:') {
        currentSection = 'safespots'
        continue
      } else if (line === 'Events:') {
        currentSection = 'events'
        continue
      }

      // Parse coordinate lines for arena and safe spots
      const coordMatch = line.match(/^(Corner\d+|Spot\d+):\s*\[([0-9.-]+),\s*([0-9.-]+)\]/)
      if (coordMatch) {
        const [, name, lat, lng] = coordMatch
        const latNum = parseFloat(lat)
        const lngNum = parseFloat(lng)

        if (currentSection === 'arena') {
          arena.push({ lat: latNum, lng: lngNum })
        } else if (currentSection === 'safespots' && safeSpots.length < 3) {
          safeSpots.push({ id: name, lat: latNum, lng: lngNum })
        }
      }

      // Parse event lines
      const eventMatch = line.match(/^Event\d+:\s*(\w+)\s*\|\s*([^|]+)\s*\|\s*(.+)$/)
      if (eventMatch && currentSection === 'events') {
        const [, type, timestamp, message] = eventMatch
        const coordsMatch = message.match(/\[([0-9.-]+),\s*([0-9.-]+)\]/)

        const event: DroneEvent = {
          type: type as DroneEvent['type'],
          timestamp,
          message,
          ...(coordsMatch && {
            coordinates: {
              lat: parseFloat(coordsMatch[1]),
              lng: parseFloat(coordsMatch[2])
            }
          })
        }
        events.push(event)
      }
    }

    return {
      arena,
      safeSpots,
      dronePosition,
      events,
      timestamp: new Date().toISOString(),
      status: 'success'
    }
  } catch (error) {
    return {
      arena: [],
      safeSpots: [],
      dronePosition: { lat: 0.0, lng: 0.0 },
      events: [],
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
    const scpCommand = `scp -i ~/.ssh/test_mac_key -o StrictHostKeyChecking=no -o ConnectTimeout=10 ${JETSON_CONFIG.username}@${JETSON_CONFIG.ip}:${JETSON_CONFIG.remotePath} ${JETSON_CONFIG.localPath}`

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

    // Return mock data as fallback
    const mockData = `DronePosition: [0.0, 0.0]

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

Events:
Event1: emergency | ${new Date().toISOString()} | Connection lost - using fallback data`

    const mockParsedData = parseArenaData(mockData)
    return {
      ...mockParsedData,
      error: `Using mock data - Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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
      dronePosition: { lat: 0.0, lng: 0.0 },
      events: [],
      timestamp: new Date().toISOString(),
      status: 'error',
      error: 'Internal server error'
    }, { status: 500 })
  }
}

// POST endpoint for testing with mock data
export async function POST(request: NextRequest) {
  try {
    const mockData = `DronePosition: [12.0330, 77.1250]

Arena:
Corner1: [12.0315, 77.1234]
Corner2: [12.0345, 77.1234]
Corner3: [12.0345, 77.1265]
Corner4: [12.0315, 77.1265]

Detected Safe Spots
SafeSpots:
Spot1: [12.0338, 77.1245]
Spot2: [12.0338, 77.1263]
Spot3: [12.0323, 77.1263]

Events:
Event1: takeoff | ${new Date(Date.now() - 60000).toISOString()} | Drone taking off from base
Event2: waypoint_reached | ${new Date(Date.now() - 30000).toISOString()} | Reached waypoint 1 at [12.0338, 77.1245]
Event3: mission_start | ${new Date().toISOString()} | Starting mission patrol`

    const parsedData = parseArenaData(mockData)

    return NextResponse.json(parsedData, { status: 200 })
  } catch (error) {
    return NextResponse.json({
      arena: [],
      safeSpots: [],
      dronePosition: { lat: 0.0, lng: 0.0 },
      events: [],
      timestamp: new Date().toISOString(),
      status: 'error',
      error: 'Mock data parsing failed'
    }, { status: 500 })
  }
}