import { NextRequest, NextResponse } from 'next/server'
import { readFileSync, writeFileSync, existsSync, unlinkSync, readdirSync } from 'fs'
import { join } from 'path'

const HISTORY_DIR = join(process.cwd(), 'public', 'params_history')
const PARAMS_DIR = join(process.cwd(), 'public', 'params')

// Define the telemetry data structure
interface TelemetrySnapshot {
  timestamp: string
  time_boot_ms: number
  battery?: {
    voltage: number
    current: number
    remaining: number
    temperature: number
  }
  position?: {
    x: number
    y: number
    z: number
    lat: number
    lon: number
    alt: number
    relative_alt: number
  }
  attitude?: {
    roll: number
    pitch: number
    yaw: number
    rollspeed: number
    pitchspeed: number
    yawspeed: number
  }
  velocity?: {
    vx: number
    vy: number
    vz: number
  }
  imu?: {
    xacc: number
    yacc: number
    zacc: number
    xgyro: number
    ygyro: number
    zgyro: number
    xmag: number
    ymag: number
    zmag: number
  }
  rangefinder?: {
    distance: number
  }
  heartbeat?: {
    system_status: number
    base_mode: number
    custom_mode: number
  }
}

// Function to read current telemetry data
async function getCurrentTelemetryData(): Promise<TelemetrySnapshot> {
  const timestamp = new Date().toISOString()
  let time_boot_ms = Date.now()
  
  const snapshot: TelemetrySnapshot = {
    timestamp,
    time_boot_ms
  }

  try {
    // Read BATTERY_STATUS
    const batteryPath = join(PARAMS_DIR, 'BATTERY_STATUS.json')
    if (existsSync(batteryPath)) {
      const battery = JSON.parse(readFileSync(batteryPath, 'utf8'))
      snapshot.battery = {
        voltage: battery.voltages?.[0] || 0,
        current: battery.current_battery || 0,
        remaining: battery.battery_remaining || 0,
        temperature: battery.temperature || 0
      }
    }

    // Read LOCAL_POSITION_NED
    const localPosPath = join(PARAMS_DIR, 'LOCAL_POSITION_NED.json')
    if (existsSync(localPosPath)) {
      const localPos = JSON.parse(readFileSync(localPosPath, 'utf8'))
      time_boot_ms = localPos.time_boot_ms || time_boot_ms
      snapshot.position = {
        x: localPos.x || 0,
        y: localPos.y || 0,
        z: localPos.z || 0,
        lat: 0,
        lon: 0,
        alt: 0,
        relative_alt: 0
      }
      snapshot.velocity = {
        vx: localPos.vx || 0,
        vy: localPos.vy || 0,
        vz: localPos.vz || 0
      }
    }

    // Read GLOBAL_POSITION_INT
    const globalPosPath = join(PARAMS_DIR, 'GLOBAL_POSITION_INT.json')
    if (existsSync(globalPosPath)) {
      const globalPos = JSON.parse(readFileSync(globalPosPath, 'utf8'))
      if (snapshot.position) {
        snapshot.position.lat = globalPos.lat || 0
        snapshot.position.lon = globalPos.lon || 0
        snapshot.position.alt = globalPos.alt || 0
        snapshot.position.relative_alt = globalPos.relative_alt || 0
      } else {
        snapshot.position = {
          x: 0,
          y: 0,
          z: 0,
          lat: globalPos.lat || 0,
          lon: globalPos.lon || 0,
          alt: globalPos.alt || 0,
          relative_alt: globalPos.relative_alt || 0
        }
      }
    }

    // Read ATTITUDE
    const attitudePath = join(PARAMS_DIR, 'ATTITUDE.json')
    if (existsSync(attitudePath)) {
      const attitude = JSON.parse(readFileSync(attitudePath, 'utf8'))
      time_boot_ms = attitude.time_boot_ms || time_boot_ms
      snapshot.attitude = {
        roll: attitude.roll || 0,
        pitch: attitude.pitch || 0,
        yaw: attitude.yaw || 0,
        rollspeed: attitude.rollspeed || 0,
        pitchspeed: attitude.pitchspeed || 0,
        yawspeed: attitude.yawspeed || 0
      }
    }

    // Read RAW_IMU
    const imuPath = join(PARAMS_DIR, 'RAW_IMU.json')
    if (existsSync(imuPath)) {
      const imu = JSON.parse(readFileSync(imuPath, 'utf8'))
      snapshot.imu = {
        xacc: imu.xacc || 0,
        yacc: imu.yacc || 0,
        zacc: imu.zacc || 0,
        xgyro: imu.xgyro || 0,
        ygyro: imu.ygyro || 0,
        zgyro: imu.zgyro || 0,
        xmag: imu.xmag || 0,
        ymag: imu.ymag || 0,
        zmag: imu.zmag || 0
      }
    }

    // Read RANGEFINDER
    const rangefinderPath = join(PARAMS_DIR, 'RANGEFINDER.json')
    if (existsSync(rangefinderPath)) {
      const rangefinder = JSON.parse(readFileSync(rangefinderPath, 'utf8'))
      snapshot.rangefinder = {
        distance: rangefinder.distance || 0
      }
    }

    // Read DISTANCE_SENSOR (alternative/backup for rangefinder)
    const distanceSensorPath = join(PARAMS_DIR, 'DISTANCE_SENSOR.json')
    if (existsSync(distanceSensorPath)) {
      const distanceSensor = JSON.parse(readFileSync(distanceSensorPath, 'utf8'))
      // If we don't have rangefinder data, use distance sensor
      if (!snapshot.rangefinder || snapshot.rangefinder.distance === 0) {
        snapshot.rangefinder = {
          distance: distanceSensor.current_distance || distanceSensor.distance || 0
        }
      }
    }

    // Read HEARTBEAT
    const heartbeatPath = join(PARAMS_DIR, 'HEARTBEAT.json')
    if (existsSync(heartbeatPath)) {
      const heartbeat = JSON.parse(readFileSync(heartbeatPath, 'utf8'))
      snapshot.heartbeat = {
        system_status: heartbeat.system_status || 0,
        base_mode: heartbeat.base_mode || 0,
        custom_mode: heartbeat.custom_mode || 0
      }
    }

    snapshot.time_boot_ms = time_boot_ms

  } catch (error) {
    console.error('Error reading telemetry data:', error)
  }

  return snapshot
}

// Function to append data to history file
function appendToHistory(data: TelemetrySnapshot) {
  const today = new Date().toISOString().split('T')[0]
  const historyFile = join(HISTORY_DIR, `history_${today}.json`)
  
  let historyData: TelemetrySnapshot[] = []
  
  // Read existing data if file exists
  if (existsSync(historyFile)) {
    try {
      const existing = readFileSync(historyFile, 'utf8')
      historyData = JSON.parse(existing)
    } catch (error) {
      console.error('Error reading history file:', error)
      historyData = []
    }
  }
  
  // Add new data point
  historyData.push(data)
  
  // Keep only last 1000 data points to prevent file from getting too large
  if (historyData.length > 1000) {
    historyData = historyData.slice(-1000)
  }
  
  // Write back to file
  try {
    writeFileSync(historyFile, JSON.stringify(historyData, null, 2))
  } catch (error) {
    console.error('Error writing history file:', error)
  }
}

// Function to clear all history data
function clearHistoryData() {
  try {
    // Get all history files
    const files = readdirSync(HISTORY_DIR)
    const historyFiles = files.filter(file => file.startsWith('history_') && file.endsWith('.json'))
    
    // Delete all history files
    let deletedCount = 0
    historyFiles.forEach(file => {
      const filePath = join(HISTORY_DIR, file)
      try {
        unlinkSync(filePath)
        deletedCount++
      } catch (error) {
        console.error(`Error deleting file ${file}:`, error)
      }
    })
    
    return {
      success: true,
      deletedFiles: deletedCount,
      message: `Cleared ${deletedCount} history files`
    }
  } catch (error) {
    console.error('Error clearing history data:', error)
    return {
      success: false,
      error: 'Failed to clear history data'
    }
  }
}
function getHistoryData(days: number = 1): TelemetrySnapshot[] {
  let allData: TelemetrySnapshot[] = []
  
  for (let i = 0; i < days; i++) {
    const date = new Date()
    date.setDate(date.getDate() - i)
    const dateStr = date.toISOString().split('T')[0]
    const historyFile = join(HISTORY_DIR, `history_${dateStr}.json`)
    
    if (existsSync(historyFile)) {
      try {
        const data = JSON.parse(readFileSync(historyFile, 'utf8'))
        allData = [...data, ...allData]
      } catch (error) {
        console.error(`Error reading history file for ${dateStr}:`, error)
      }
    }
  }
  
  // Sort by timestamp
  allData.sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
  
  return allData
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get('days') || '1')
    const action = searchParams.get('action')
    
    if (action === 'collect') {
      // Collect current data and store it
      const currentData = await getCurrentTelemetryData()
      appendToHistory(currentData)
      
      return NextResponse.json({
        status: 'success',
        message: 'Data collected and stored',
        data: currentData
      })
    } else if (action === 'clear') {
      // Clear all history data
      const result = clearHistoryData()
      
      if (result.success) {
        return NextResponse.json({
          status: 'success',
          message: result.message,
          deletedFiles: result.deletedFiles
        })
      } else {
        return NextResponse.json({
          status: 'error',
          error: result.error
        }, { status: 500 })
      }
    } else {
      // Return historical data
      const historyData = getHistoryData(days)
      
      return NextResponse.json({
        status: 'success',
        data: historyData,
        count: historyData.length
      })
    }
  } catch (error) {
    console.error('Error in history-data API:', error)
    return NextResponse.json({
      status: 'error',
      error: 'Failed to process history data request'
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    // Force collect current data
    const currentData = await getCurrentTelemetryData()
    appendToHistory(currentData)
    
    return NextResponse.json({
      status: 'success',
      message: 'Data manually collected and stored',
      data: currentData
    })
  } catch (error) {
    console.error('Error in POST history-data API:', error)
    return NextResponse.json({
      status: 'error',
      error: 'Failed to collect data'
    }, { status: 500 })
  }
}
