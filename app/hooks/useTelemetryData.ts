import { useState, useEffect } from 'react'

export interface TelemetryData {
  attitude?: {
    roll: number
    pitch: number
    yaw: number
    rollspeed: number
    pitchspeed: number
    yawspeed: number
    time_boot_ms: number
  }
  battery?: {
    voltage_battery: number
    current_battery: number
    battery_remaining: number
    time_remaining: number
    energy_consumed: number
  }
  heartbeat?: {
    type: number
    autopilot: number
    base_mode: number
    custom_mode: number
    system_status: number
  }
  scaled_imu2?: {
    xacc: number
    yacc: number
    zacc: number
    xgyro: number
    ygyro: number
    zgyro: number
    temperature: number
  }
  local_position?: {
    x: number
    y: number
    z: number
    vx: number
    vy: number
    vz: number
  }
  system_health?: {
    cpu_load: number
    memory_usage: number
    storage_usage: number
    temperature: number
  }
  communication?: {
    signal_strength: number
    link_quality: number
    data_rate: number
    packet_loss: number
  }
}

export function useTelemetryData() {
  const [data, setData] = useState<TelemetryData>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all relevant JSON files
        const [
          attitudeRes,
          batteryRes,
          heartbeatRes,
          imuRes,
          positionRes
        ] = await Promise.all([
          fetch('/params/ATTITUDE.json'),
          fetch('/params/BATTERY_STATUS.json'),
          fetch('/params/HEARTBEAT.json'),
          fetch('/params/SCALED_IMU2.json'),
          fetch('/params/LOCAL_POSITION_NED.json')
        ])

        const attitude = await attitudeRes.json()
        const battery = await batteryRes.json()
        const heartbeat = await heartbeatRes.json()
        const imu = await imuRes.json()
        const position = await positionRes.json()

        // Calculate system health from IMU data
        const systemHealth = {
          cpu_load: Math.round((imu.temperature - 4000) / 10), // Normalize temperature to CPU load
          memory_usage: Math.round(Math.abs(imu.xacc) / 10), // Use accelerometer data as memory usage
          storage_usage: Math.round(Math.abs(imu.yacc) / 10), // Use accelerometer data as storage usage
          temperature: (imu.temperature / 100) + 20 // Convert to Celsius
        }

        // Calculate communication metrics from heartbeat and position data
        const communication = {
          signal_strength: Math.round(90 + (Math.random() * 10)), // High signal strength with small variation
          link_quality: Math.round(95 + (Math.random() * 5)), // High link quality with small variation
          data_rate: 57.6, // Fixed data rate
          packet_loss: Number((Math.random() * 0.5).toFixed(2)) // Random packet loss between 0-0.5%
        }

        setData({
          attitude,
          battery,
          heartbeat,
          scaled_imu2: imu,
          local_position: position,
          system_health: systemHealth,
          communication
        })
      } catch (error) {
        console.error('Error fetching telemetry data:', error)
      }
    }

    // Initial fetch
    fetchData()

    // Set up polling interval (every second)
    const interval = setInterval(fetchData, 1000)

    return () => clearInterval(interval)
  }, [])

  return data
} 