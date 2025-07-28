import { useState, useEffect, useRef } from 'react'

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
    voltages: number[]
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
  const [isConnected, setIsConnected] = useState(false)
  const [lastHeartbeatTime, setLastHeartbeatTime] = useState<number | null>(null)
  const lastValidDataRef = useRef<TelemetryData>({})

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch all relevant JSON files
        const [
          attitudeRes,
          batteryRes,
          heartbeatRes,
          imuRes,
          positionRes,
          sysStatusRes,
          meminfoRes
        ] = await Promise.all([
          fetch('/params/ATTITUDE.json?t=' + Date.now(), { cache: 'no-store' }),
          fetch('/params/BATTERY_STATUS.json?t=' + Date.now(), { cache: 'no-store' }),
          fetch('/params/HEARTBEAT.json?t=' + Date.now(), { cache: 'no-store' }),
          fetch('/params/SCALED_IMU2.json?t=' + Date.now(), { cache: 'no-store' }),
          fetch('/params/LOCAL_POSITION_NED.json?t=' + Date.now(), { cache: 'no-store' }),
          fetch('/params/SYS_STATUS.json?t=' + Date.now(), { cache: 'no-store' }),
          fetch('/params/MEMINFO.json?t=' + Date.now(), { cache: 'no-store' })
        ])

        // Check if any files are missing (404 means listen.py not running)
        if (!attitudeRes.ok || !batteryRes.ok || !heartbeatRes.ok || !imuRes.ok || !positionRes.ok) {
          throw new Error('JSON files not found - listen.py not running')
        }

        const attitude = await attitudeRes.json()
        const battery = await batteryRes.json()
        const heartbeat = await heartbeatRes.json()
        const imu = await imuRes.json()
        const position = await positionRes.json()
        const sysStatus = sysStatusRes.ok ? await sysStatusRes.json() : null
        const meminfo = meminfoRes.ok ? await meminfoRes.json() : null

        // Check if we have a valid heartbeat
        const currentTime = Date.now()
        const hasValidHeartbeat = heartbeat && heartbeat.mavpackettype === "HEARTBEAT"

        if (hasValidHeartbeat) {
          setLastHeartbeatTime(currentTime)
          setIsConnected(true)
        }

        // Check if connection is stale (more than 5 seconds since last heartbeat)
        const isStale = lastHeartbeatTime && (currentTime - lastHeartbeatTime) > 5000

        // Calculate system health from SYS_STATUS and MEMINFO
        const systemHealth = {
          cpu_load: sysStatus ? Math.round((sysStatus.load / 1000) * 100) : 0, // Convert load to percentage
          memory_usage: meminfo ? Math.round(((meminfo.freemem32 > 0 ? ((1000000 - meminfo.freemem32) / 1000000) * 100 : 0))) : 0,
          storage_usage: 0, // Not available in current telemetry
          temperature: sysStatus ? Math.round(sysStatus.voltage_battery / 100) : 0 // Use battery temp as system temp
        }

        // Set communication metrics to 0 values when no real data
        const communication = {
          signal_strength: 0,
          link_quality: 0,
          data_rate: 0,
          packet_loss: 0
        }

        const newData = {
          attitude,
          battery,
          heartbeat,
          scaled_imu2: imu,
          local_position: position,
          system_health: systemHealth,
          communication
        }

        // Store the valid data
        if (hasValidHeartbeat && !isStale) {
          lastValidDataRef.current = newData
          setData(newData)
        } else if (isStale && Object.keys(lastValidDataRef.current).length > 0) {
          // Keep showing last valid data when connection is stale
          setIsConnected(false)
          setData(lastValidDataRef.current)
        } else {
          // Initial state or no valid data yet - show 0 values
          setData({
            system_health: systemHealth,
            communication
          })
        }
      } catch (error) {
        console.error('Error fetching telemetry data:', error)
        // If we have previous valid data and it's not too old, keep showing it
        if (Object.keys(lastValidDataRef.current).length > 0) {
          setData(lastValidDataRef.current)
        } else {
          // Initial state - show 0 values
          setData({
            system_health: {
              cpu_load: 0,
              memory_usage: 0,
              storage_usage: 0,
              temperature: 0
            },
            communication: {
              signal_strength: 0,
              link_quality: 0,
              data_rate: 0,
              packet_loss: 0
            }
          })
        }
        setIsConnected(false)
      }
    }

    // Initial fetch
    fetchData()

    // Set up polling interval (every second)
    const interval = setInterval(fetchData, 1000)

    return () => clearInterval(interval)
  }, [lastHeartbeatTime])

  return { data, isConnected }
} 