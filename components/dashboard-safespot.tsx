"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Wifi, WifiOff, MapPin, Clock } from "lucide-react"

// Position simulator for testing
class PositionSimulator {
  x = 1.5
  y = 1.2
  vx = 0.2
  vy = 0.15
  radius = 2
  angle = 0

  update() {
    this.angle += 0.02
    this.x = 1.5 + this.radius * Math.cos(this.angle)
    this.y = 1.2 + this.radius * Math.sin(this.angle * 0.7)

    this.x = Math.max(-4, Math.min(4, this.x))
    this.y = Math.max(-3, Math.min(3, this.y))

    return { x: this.x, y: this.y }
  }
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

interface JetsonData {
  arena: ArenaCorner[]
  safeSpots: SafeSpot[]
  timestamp: string
  status: 'success' | 'error'
  error?: string
}

export default function DashboardSafeSpot() {
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })
  const [detectedSpots, setDetectedSpots] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [positionHistory, setPositionHistory] = useState<{ x: number, y: number }[]>([])
  const [jetsonData, setJetsonData] = useState<JetsonData | null>(null)
  const [jetsonStatus, setJetsonStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [lastJetsonUpdate, setLastJetsonUpdate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const simulatorRef = useRef(new PositionSimulator())

  // Detection threshold (0.5 meters)
  const DETECTION_THRESHOLD = 0.5

  // Calculate distance between two points
  const calculateDistance = (pos1: { x: number, y: number }, pos2: { x: number, y: number }) => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
  }

  // Convert coordinates to local field coordinates
  const coordsToFieldCoords = (coords: { lat: number, lng: number }, arena: ArenaCorner[]): { x: number, y: number } => {
    if (arena.length < 4) {
      // Fallback to simple conversion if arena not available
      return {
        x: Math.max(0, Math.min(9, (coords.lat - 12.03) * 1000)),
        y: Math.max(0, Math.min(12, (coords.lng - 77.12) * 1000))
      }
    }

    // Find bounding box of arena
    const minLat = Math.min(...arena.map(c => c.lat))
    const maxLat = Math.max(...arena.map(c => c.lat))
    const minLng = Math.min(...arena.map(c => c.lng))
    const maxLng = Math.max(...arena.map(c => c.lng))

    // Convert coordinates to normalized coordinates (0-1)
    const normalizedX = (coords.lng - minLng) / (maxLng - minLng)
    const normalizedY = (coords.lat - minLat) / (maxLat - minLat)

    // Scale to field dimensions (9x12 meters)
    return {
      x: Math.max(0, Math.min(9, normalizedX * 9)),
      y: Math.max(0, Math.min(12, normalizedY * 12))
    }
  }

  // Fetch data from Jetson device
  const fetchJetsonData = async (useMockData = false) => {
    // Don't show loading for subsequent fetches to prevent flickering
    if (!jetsonData) setLoading(true)
    try {
      const endpoint = '/api/jetson-data'
      const method = useMockData ? 'POST' : 'GET'

      const response = await fetch(endpoint, {
        method,
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const newData: JetsonData = await response.json()
      setJetsonData(newData)
      setLastJetsonUpdate(new Date().toLocaleTimeString())
      setLoading(false)

      if (newData.status === 'success') {
        setJetsonStatus('connected')
        console.log('Safe spots data:', newData.safeSpots)
        console.log('Arena data:', newData.arena)
      } else {
        setJetsonStatus('error')
        console.error('Jetson data fetch error:', newData.error)
      }
    } catch (error) {
      console.error('Error fetching Jetson data:', error)
      setJetsonStatus('error')
      if (!jetsonData) setLoading(false)
    }
  }

  // Fetch real-time position data from params
  useEffect(() => {
    const fetchPositionData = async () => {
      try {
        // Try to fetch LOCAL_POSITION_NED data first
        const localResponse = await fetch(`/params/local_position_ned.json?t=${Date.now()}`)

        if (localResponse.ok) {
          const localData = await localResponse.json()
          if (localData && typeof localData.x === 'number' && typeof localData.y === 'number') {
            // Convert NED coordinates to field coordinates with proper scaling
            const fieldX = Math.max(0, Math.min(9, localData.x * 0.5 + 4.5))
            const fieldY = Math.max(0, Math.min(12, localData.y * 0.5 + 6))

            setCurrentPosition({ x: fieldX, y: fieldY })
            setConnectionStatus(`Live Data - NED (${localData.time_boot_ms}ms)`)

            // Update position history for trail effect
            setPositionHistory(prev => {
              const newHistory = [...prev, { x: fieldX, y: fieldY }]
              return newHistory.slice(-10)
            })

            return
          }
        }

        // Fallback to GLOBAL_POSITION_INT if LOCAL_POSITION_NED fails
        const globalResponse = await fetch(`/params/global_position_int.json?t=${Date.now()}`)

        if (globalResponse.ok) {
          const globalData = await globalResponse.json()
          if (globalData && (globalData.lat !== 0 || globalData.lon !== 0)) {
            // If we have Jetson arena data, use proper coordinate conversion
            if (jetsonData?.arena && jetsonData.arena.length >= 4) {
              const coordsPos = { lat: globalData.lat / 1e7, lng: globalData.lon / 1e7 }
              const fieldPos = coordsToFieldCoords(coordsPos, jetsonData.arena)
              setCurrentPosition(fieldPos)
            } else {
              // Fallback coordinate conversion
              const fieldX = Math.max(0, Math.min(9, (globalData.lat / 1000000) % 9))
              const fieldY = Math.max(0, Math.min(12, (globalData.lon / 1000000) % 12))
              setCurrentPosition({ x: fieldX, y: fieldY })
            }

            setConnectionStatus(`Position Data - Global (${globalData.time_boot_ms}ms)`)

            setPositionHistory(prev => {
              const newHistory = [...prev, currentPosition]
              return newHistory.slice(-10)
            })

            return
          }
        }

        // If both fail, use simulated data
        throw new Error('No real data available')

      } catch (error) {
        console.error('Error fetching position data:', error)
        const simulatedPos = simulatorRef.current.update()
        setCurrentPosition(simulatedPos)
        setConnectionStatus('Simulated Data')

        setPositionHistory(prev => {
          const newHistory = [...prev, simulatedPos]
          return newHistory.slice(-10)
        })
      }
    }

    fetchPositionData()
    const intervalId = setInterval(fetchPositionData, 250)
    return () => clearInterval(intervalId)
  }, [jetsonData, currentPosition])

  // Auto-fetch Jetson data every 5 seconds
  useEffect(() => {
    fetchJetsonData() // Initial fetch with real data

    const interval = setInterval(() => {
      fetchJetsonData() // Real SCP fetch every 5 seconds
    }, 5000)

    return () => clearInterval(interval)
  }, [])

  // Check if drone is at any safe spot (dynamic from Jetson data)
  useEffect(() => {
    if (!jetsonData?.safeSpots) return

    jetsonData.safeSpots.forEach(spot => {
      // Convert coordinate safe spot to field coordinates
      const spotFieldCoords = coordsToFieldCoords(spot, jetsonData.arena)
      const distance = calculateDistance(currentPosition, spotFieldCoords)

      if (distance <= DETECTION_THRESHOLD && !detectedSpots.includes(spot.id)) {
        setDetectedSpots(prev => {
          const newDetected = [...prev, spot.id]

          // Check if this completes the mission (all 3 safe spots detected)
          if (newDetected.length === 3) {
            console.log('🏆 MISSION COMPLETE! All 3 safe spots detected!')
            alert(`� MISSION COMPLETE!\n\nAll 3 Safe Spots Detected!\n\nCongratulations! You have successfully completed the safe spot detection mission.`)
          } else {
            console.log(`�🎯 ${spot.id} Detected! Distance: ${distance.toFixed(2)}m (${newDetected.length}/3 complete)`)
            alert(`🎯 SAFE SPOT DETECTED!\n\n${spot.id}\nDistance: ${distance.toFixed(2)}m\nCoordinates: (${spot.lat.toFixed(6)}, ${spot.lng.toFixed(6)})\n\nProgress: ${newDetected.length}/3 safe spots`)
          }

          return newDetected
        })
      }
    })
  }, [currentPosition, jetsonData, detectedSpots])

  // Convert arena coordinates to field coordinates for visualization
  const getArenaFieldCoords = () => {
    if (!jetsonData?.arena || jetsonData.arena.length < 4) return []

    const minLat = Math.min(...jetsonData.arena.map(c => c.lat))
    const maxLat = Math.max(...jetsonData.arena.map(c => c.lat))
    const minLng = Math.min(...jetsonData.arena.map(c => c.lng))
    const maxLng = Math.max(...jetsonData.arena.map(c => c.lng))

    return jetsonData.arena.map(corner => ({
      x: ((corner.lng - minLng) / (maxLng - minLng)) * 9,
      y: ((corner.lat - minLat) / (maxLat - minLat)) * 12
    }))
  }

  const arenaFieldCoords = getArenaFieldCoords()
  return (
    <div className="space-y-6">

      {/* Dynamic Field Visualization */}
      <Card className="md:col-span-1">
        <CardHeader className="py-2 px-3">
          <CardTitle className="text-lg font-semibold">Live Arena & Safe Spots</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="aspect-[3/4] h-[590px] relative bg-green-50 dark:bg-green-950 border">
            <svg width="100%" height="100%" viewBox="-1 -1 11 14" className="absolute inset-0" preserveAspectRatio="xMidYMid meet">
              {/* Clipping definition - prevents any shifting of map */}
              <defs>
                <clipPath id="fieldClip">
                  <rect x="-1" y="-1" width="11" height="14" />
                </clipPath>
              </defs>

              {/* Expanded field boundary - FIXED FRAME */}
              <rect x="-1" y="-1" width="11" height="14" className="fill-green-50 dark:fill-green-950" stroke="#000" strokeWidth="0.1" />

              {/* Grid lines (expanded) - FIXED FRAME */}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
                <line key={`v${i}`} x1={i} y1="-1" x2={i} y2="13" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="0.02" />
              ))}
              {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(i => (
                <line key={`h${i}`} x1="-1" y1={i} x2="10" y2={i} className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="0.02" />
              ))}

              {/* All content within clipping bounds */}
              <g clipPath="url(#fieldClip)">
                {/* Competition Arena Boundary - FIXED (9x12m) */}
                <rect
                  x="0"
                  y="0"
                  width="9"
                  height="12"
                  fill="rgba(255,215,0,0.1)"
                  stroke="#FFD700"
                  strokeWidth="0.15"
                  strokeDasharray="0.3,0.1"
                />

                {/* Arena corners - FIXED */}
                {[[0, 0], [9, 0], [9, 12], [0, 12]].map(([x, y], index) => (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="0.15"
                    fill="#FFD700"
                    stroke="#000"
                    strokeWidth="0.03"
                  />
                ))}

                {/* Dynamic Arena from Jetson (if different from fixed) */}
                {arenaFieldCoords.length >= 4 && (
                  <g opacity="0.5">
                    <polygon
                      points={arenaFieldCoords.map(p => `${p.x},${12 - p.y}`).join(' ')}
                      fill="rgba(100,200,255,0.1)"
                      stroke="#64C8FF"
                      strokeWidth="0.08"
                      strokeDasharray="0.15,0.05"
                    />
                    {arenaFieldCoords.map((corner, index) => (
                      <circle
                        key={index}
                        cx={corner.x}
                        cy={12 - corner.y}
                        r="0.1"
                        fill="#64C8FF"
                        stroke="#000"
                        strokeWidth="0.02"
                      />
                    ))}
                  </g>
                )}

                {/* Dynamic Safe spots from Jetson */}
                {jetsonData?.safeSpots?.map(spot => {
                  const spotCoords = coordsToFieldCoords(spot, jetsonData.arena)
                  const isDetected = detectedSpots.includes(spot.id)
                  const isOutsideArena = spotCoords.x < 0 || spotCoords.x > 9 || spotCoords.y < 0 || spotCoords.y > 12

                  return (
                    <g key={spot.id}>
                      {/* Detection radius circle */}
                      <circle
                        cx={spotCoords.x}
                        cy={12 - spotCoords.y}
                        r={DETECTION_THRESHOLD}
                        fill={isDetected ? "rgba(0,255,0,0.2)" : "rgba(0,102,204,0.1)"}
                        stroke={isDetected ? "#00ff00" : "#0066cc"}
                        strokeWidth="0.03"
                        strokeDasharray="0.1,0.1"
                        opacity={isOutsideArena ? 0.5 : 1}
                      >
                        {/* Pulsing animation for detected spots */}
                        {isDetected && (
                          <animate attributeName="r" values={`${DETECTION_THRESHOLD};${DETECTION_THRESHOLD * 1.5};${DETECTION_THRESHOLD}`} dur="2s" repeatCount="indefinite" />
                        )}
                      </circle>

                      {/* Safe spot marker */}
                      <rect
                        x={spotCoords.x - 0.2}
                        y={12 - spotCoords.y - 0.2}
                        width="0.4"
                        height="0.4"
                        fill={isDetected ? "#00ff00" : "#0066cc"}
                        stroke="#000"
                        strokeWidth="0.02"
                        opacity={isOutsideArena ? 0.5 : 1}
                      />

                      {/* Spot label */}
                      <text
                        x={spotCoords.x}
                        y={12 - spotCoords.y + 0.6}
                        textAnchor="middle"
                        fontSize="0.25"
                        className="fill-black dark:fill-white"
                        fontWeight="bold"
                        opacity={isOutsideArena ? 0.5 : 1}
                      >
                        {spot.id}
                      </text>

                      {/* Field coordinates display */}
                      <text
                        x={spotCoords.x}
                        y={12 - spotCoords.y + 0.9}
                        textAnchor="middle"
                        fontSize="0.15"
                        className="fill-gray-600 dark:fill-gray-400"
                        opacity={isOutsideArena ? 0.5 : 1}
                      >
                        ({spotCoords.x.toFixed(1)}m, {spotCoords.y.toFixed(1)}m)
                      </text>

                      {/* Out of bounds indicator */}
                      {isOutsideArena && (
                        <text
                          x={spotCoords.x}
                          y={12 - spotCoords.y - 0.3}
                          textAnchor="middle"
                          fontSize="0.15"
                          fill="#ff0000"
                          fontWeight="bold"
                        >
                          OUT
                        </text>
                      )}
                    </g>
                  )
                })}

                {/* Position trail */}
                {positionHistory.length > 1 && (
                  <g>
                    <polyline
                      points={positionHistory.map(pos => `${pos.x},${12 - pos.y}`).join(' ')}
                      fill="none"
                      stroke="#ff6666"
                      strokeWidth="0.05"
                      opacity="0.7"
                      strokeDasharray="0.1,0.05"
                    />
                    {positionHistory.slice(0, -1).map((pos, index) => (
                      <circle
                        key={index}
                        cx={pos.x}
                        cy={12 - pos.y}
                        r="0.08"
                        fill="#ff9999"
                        opacity={0.3 + (index / positionHistory.length) * 0.4}
                      />
                    ))}
                  </g>
                )}

                {/* Current drone position */}
                <g>
                  {(() => {
                    const isOutsideArena = currentPosition.x < 0 || currentPosition.x > 9 || currentPosition.y < 0 || currentPosition.y > 12

                    return (
                      <>
                        <circle
                          cx={currentPosition.x}
                          cy={12 - currentPosition.y}
                          r="0.4"
                          fill="rgba(255,0,0,0.3)"
                          stroke="none"
                        />
                        <circle
                          cx={currentPosition.x}
                          cy={12 - currentPosition.y}
                          r="0.25"
                          fill={isOutsideArena ? "#ff8800" : "#ff0000"}
                          stroke="#000000"
                          strokeWidth="0.05"
                        />
                        <circle
                          cx={currentPosition.x}
                          cy={12 - currentPosition.y}
                          r="0.12"
                          fill="#ffff00"
                          stroke="#000000"
                          strokeWidth="0.02"
                        />

                        {/* Pulse animation circle */}
                        <circle
                          cx={currentPosition.x}
                          cy={12 - currentPosition.y}
                          r="0.3"
                          fill="none"
                          stroke={isOutsideArena ? "#ff8800" : "#ff0000"}
                          strokeWidth="0.03"
                          opacity="0.6"
                        >
                          <animate attributeName="r" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite" />
                          <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite" />
                        </circle>

                        {/* Out of arena warning */}
                        {isOutsideArena && (
                          <text
                            x={currentPosition.x}
                            y={12 - currentPosition.y - 0.6}
                            textAnchor="middle"
                            fontSize="0.2"
                            fill="#ff0000"
                            fontWeight="bold"
                          >
                            OUT OF ARENA
                          </text>
                        )}
                      </>
                    )
                  })()}
                </g>
              </g>

              {/* Fixed coordinates display */}
              <text x="4.5" y="0.5" textAnchor="middle" fontSize="0.3" className="fill-gray-600 dark:fill-gray-400">
                Arena: 9×12m Competition Zone
              </text>

              {/* Mission Complete Banner */}
              {detectedSpots.length === 3 && (
                <>
                  <rect x="1" y="5" width="7" height="2" fill="rgba(0,255,0,0.8)" stroke="#00ff00" strokeWidth="0.1" rx="0.2" />
                  <text x="4.5" y="6.2" textAnchor="middle" fontSize="0.4" fill="#000" fontWeight="bold">
                    🏆 MISSION COMPLETE! 🏆
                  </text>
                  <text x="4.5" y="6.6" textAnchor="middle" fontSize="0.2" fill="#000">
                    All 3 Safe Spots Detected!
                  </text>
                </>
              )}
            </svg>
          </div>
        </CardContent>
      </Card>

    </div>
  )
}