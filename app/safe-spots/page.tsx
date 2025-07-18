"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Wifi, WifiOff, MapPin, Clock } from "lucide-react"

// Position data simulator for fallback
export class PositionSimulator {
  private x: number;
  private y: number;
  private radius: number;
  private angle: number;
  private angleIncrement: number;

  constructor() {
    this.x = 0;
    this.y = 0;
    this.radius = 4;
    this.angle = 0;
    this.angleIncrement = 0.02;
  }

  update(): { x: number; y: number } {
    this.angle += this.angleIncrement;
    this.x = this.radius * Math.sin(this.angle) + 4.5; // Center around field
    this.y = this.radius * Math.cos(this.angle) + 6;
    return { x: this.x, y: this.y };
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

export default function SafeSpotsPage() {
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })
  const [detectedSpots, setDetectedSpots] = useState<string[]>([])
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [positionHistory, setPositionHistory] = useState<{x: number, y: number}[]>([])
  const [jetsonData, setJetsonData] = useState<JetsonData | null>(null)
  const [jetsonStatus, setJetsonStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [lastJetsonUpdate, setLastJetsonUpdate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const simulatorRef = useRef(new PositionSimulator())
  
  // Detection threshold (0.5 meters)
  const DETECTION_THRESHOLD = 0.5

  // Calculate distance between two points
  const calculateDistance = (pos1: {x: number, y: number}, pos2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
  }

  // Convert GPS coordinates to local field coordinates
  const gpsToFieldCoords = (gpsCoords: { lat: number, lng: number }, arena: ArenaCorner[]): { x: number, y: number } => {
    if (arena.length < 4) {
      // Fallback to simple conversion if arena not available
      return {
        x: Math.max(0, Math.min(9, (gpsCoords.lat - 12.03) * 1000)),
        y: Math.max(0, Math.min(12, (gpsCoords.lng - 77.12) * 1000))
      }
    }

    // Find bounding box of arena
    const minLat = Math.min(...arena.map(c => c.lat))
    const maxLat = Math.max(...arena.map(c => c.lat))
    const minLng = Math.min(...arena.map(c => c.lng))
    const maxLng = Math.max(...arena.map(c => c.lng))

    // Convert GPS to normalized coordinates (0-1)
    const normalizedX = (gpsCoords.lng - minLng) / (maxLng - minLng)
    const normalizedY = (gpsCoords.lat - minLat) / (maxLat - minLat)

    // Scale to field dimensions (9x12 meters)
    return {
      x: Math.max(0, Math.min(9, normalizedX * 9)),
      y: Math.max(0, Math.min(12, normalizedY * 12))
    }
  }

  // Fetch data from Jetson device
  const fetchJetsonData = async (useMockData = false) => {
    setLoading(true)
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
      
      if (newData.status === 'success') {
        setJetsonStatus('connected')
      } else {
        setJetsonStatus('error')
        console.error('Jetson data fetch error:', newData.error)
      }
    } catch (error) {
      console.error('Error fetching Jetson data:', error)
      setJetsonStatus('error')
    } finally {
      setLoading(false)
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
            // If we have Jetson arena data, use proper GPS conversion
            if (jetsonData?.arena && jetsonData.arena.length >= 4) {
              const gpsPos = { lat: globalData.lat / 1e7, lng: globalData.lon / 1e7 }
              const fieldPos = gpsToFieldCoords(gpsPos, jetsonData.arena)
              setCurrentPosition(fieldPos)
            } else {
              // Fallback GPS conversion
              const fieldX = Math.max(0, Math.min(9, (globalData.lat / 1000000) % 9))
              const fieldY = Math.max(0, Math.min(12, (globalData.lon / 1000000) % 12))
              setCurrentPosition({ x: fieldX, y: fieldY })
            }
            
            setConnectionStatus(`GPS Data - Global (${globalData.time_boot_ms}ms)`)
            
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

  // Auto-fetch Jetson data every 30 seconds
  useEffect(() => {
    fetchJetsonData(true) // Initial fetch with mock data
    
    const interval = setInterval(() => {
      fetchJetsonData() // Real SCP fetch every 30 seconds
    }, 30000)

    return () => clearInterval(interval)
  }, [])

  // Check if drone is at any safe spot (dynamic from Jetson data)
  useEffect(() => {
    if (!jetsonData?.safeSpots) return

    jetsonData.safeSpots.forEach(spot => {
      // Convert GPS safe spot to field coordinates
      const spotFieldCoords = gpsToFieldCoords(spot, jetsonData.arena)
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
            alert(`🎯 SAFE SPOT DETECTED!\n\n${spot.id}\nDistance: ${distance.toFixed(2)}m\nGPS: (${spot.lat.toFixed(6)}, ${spot.lng.toFixed(6)})\n\nProgress: ${newDetected.length}/3 safe spots`)
          }
          
          return newDetected
        })
      }
    })
  }, [currentPosition, jetsonData, detectedSpots])

  // Convert arena GPS coordinates to field coordinates for visualization
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
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🛡️ Dynamic Safe Spot Detection</h1>
        <div className="flex items-center gap-4">
          <Badge variant={jetsonStatus === 'connected' ? 'default' : 'destructive'}>
            {jetsonStatus === 'connected' ? <Wifi className="w-4 h-4 mr-1" /> : <WifiOff className="w-4 h-4 mr-1" />}
            Jetson {jetsonStatus}
          </Badge>
          <Button
            onClick={() => fetchJetsonData()}
            disabled={loading}
            size="sm"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Updating...' : 'Refresh'}
          </Button>
          <Button
            onClick={() => fetchJetsonData(true)}
            variant="outline"
            size="sm"
          >
            Mock Data
          </Button>
        </div>
      </div>

      {/* Jetson Connection Status */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                jetsonStatus === 'connected' ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="font-medium">Jetson: {jetsonStatus}</span>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4" />
              Last Update: {lastJetsonUpdate || 'Never'}
            </div>
            <div className="text-sm font-mono">
              Drone: X: {currentPosition.x.toFixed(3)}m, Y: {currentPosition.y.toFixed(3)}m
            </div>
          </div>
        </CardContent>
      </Card>

      {jetsonData?.status === 'error' && (
        <Alert variant="destructive">
          <AlertTitle>Jetson Connection Error</AlertTitle>
          <AlertDescription>
            {jetsonData.error || 'Failed to fetch data from Jetson device via SCP'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dynamic Field Visualization */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Live Arena & Safe Spots</CardTitle>
            <div className="text-sm text-muted-foreground">
              Arena: {jetsonData?.arena?.length || 0} corners • Safe Spots: {jetsonData?.safeSpots?.length || 0} detected
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-[3/4] relative bg-green-50 dark:bg-green-950 border">
              <svg width="100%" height="100%" viewBox="-1 -1 11 14" className="absolute inset-0" preserveAspectRatio="xMidYMid meet">
                {/* Clipping definition - prevents any shifting of map */}
                <defs>
                  <clipPath id="fieldClip">
                    <rect x="-1" y="-1" width="11" height="14"/>
                  </clipPath>
                </defs>
                
                {/* Expanded field boundary - FIXED FRAME */}
                <rect x="-1" y="-1" width="11" height="14" className="fill-green-50 dark:fill-green-950" stroke="#000" strokeWidth="0.1"/>
                
                {/* Grid lines (expanded) - FIXED FRAME */}
                {[0,1,2,3,4,5,6,7,8,9,10].map(i => (
                  <line key={`v${i}`} x1={i} y1="-1" x2={i} y2="13" className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="0.02"/>
                ))}
                {[0,1,2,3,4,5,6,7,8,9,10,11,12,13].map(i => (
                  <line key={`h${i}`} x1="-1" y1={i} x2="10" y2={i} className="stroke-gray-300 dark:stroke-gray-600" strokeWidth="0.02"/>
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
                  {[[0,0], [9,0], [9,12], [0,12]].map(([x,y], index) => (
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
                    const spotCoords = gpsToFieldCoords(spot, jetsonData.arena)
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
                            <animate attributeName="r" values={`${DETECTION_THRESHOLD};${DETECTION_THRESHOLD * 1.5};${DETECTION_THRESHOLD}`} dur="2s" repeatCount="indefinite"/>
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
                            <animate attributeName="r" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite"/>
                            <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
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
                    <rect x="1" y="5" width="7" height="2" fill="rgba(0,255,0,0.8)" stroke="#00ff00" strokeWidth="0.1" rx="0.2"/>
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

        {/* Live Data Panel */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Live Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Jetson Data Info */}
            {jetsonData && (
              <div>
                <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  Jetson Data
                </h3>
                <div className="grid grid-cols-2 gap-2 text-sm font-mono bg-gray-50 p-3 rounded">
                  <div>Arena Corners: {jetsonData.arena.length}</div>
                  <div>Safe Spots: {jetsonData.safeSpots.length}</div>
                  <div className="col-span-2 text-xs mt-2">
                    Last fetch: {new Date(jetsonData.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            )}

            {/* Current Position */}
            <div>
              <h3 className="text-lg font-semibold mb-2">📍 Current Position</h3>
              <div className="grid grid-cols-2 gap-2 text-sm font-mono bg-gray-50 p-3 rounded">
                <div>X: {currentPosition.x.toFixed(3)}m</div>
                <div>Y: {currentPosition.y.toFixed(3)}m</div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Update Rate: 4Hz (250ms) | Source: {connectionStatus}
              </div>
            </div>

            {/* Detection Summary */}
            <Alert className={detectedSpots.length === 3 ? 'border-green-500 bg-green-50' : ''}>
              <AlertTitle className="flex items-center gap-2">
                🎯 Detection Summary
                {detectedSpots.length === 3 && (
                  <Badge variant="default" className="bg-green-500">
                    ✅ MISSION COMPLETE
                  </Badge>
                )}
              </AlertTitle>
              <AlertDescription>
                Detected: {detectedSpots.length}/3 safe spots
                <br />
                Detection Threshold: {DETECTION_THRESHOLD}m radius
                {detectedSpots.length === 3 && (
                  <>
                    <br />
                    <span className="text-green-700 font-bold">
                      🏆 All safe spots detected! Mission accomplished!
                    </span>
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* Dynamic Safe Spots Status */}
            {jetsonData?.safeSpots && (
              <div>
                <h3 className="text-lg font-semibold mb-3">Safe Spots Status</h3>
                <div className="space-y-3 max-h-48 overflow-y-auto">
                  {jetsonData.safeSpots.map(spot => {
                    const spotCoords = gpsToFieldCoords(spot, jetsonData.arena)
                    const distance = calculateDistance(currentPosition, spotCoords)
                    const isDetected = detectedSpots.includes(spot.id)
                    
                    return (
                      <div key={spot.id} className={`p-3 border rounded-lg transition-colors ${
                        isDetected ? 'border-green-500 bg-green-50' : 'border-gray-200'
                      }`}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              isDetected ? 'bg-green-500' : 'bg-gray-300'
                            }`} />
                            <div>
                              <div className="font-medium">{spot.id}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                Field: ({spotCoords.x.toFixed(1)}m, {spotCoords.y.toFixed(1)}m)
                              </div>
                              <div className="text-xs text-muted-foreground font-mono">
                                GPS: {spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                Distance: {distance.toFixed(2)}m
                              </div>
                            </div>
                          </div>
                          <span className={`text-sm font-medium px-2 py-1 rounded ${
                            isDetected 
                              ? 'text-green-700 bg-green-100' 
                              : 'text-gray-500 bg-gray-100'
                          }`}>
                            {isDetected ? '✅ DETECTED' : '⏳ PENDING'}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* GPS Coordinates & Timestamp */}
      {jetsonData && (
        <Card>
          <CardHeader>
            <CardTitle>Raw GPS Data from Jetson</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Arena Corners</h4>
                <div className="space-y-1 text-sm font-mono">
                  {jetsonData.arena.map((corner, index) => (
                    <div key={index} className="bg-yellow-50 p-2 rounded">
                      Corner{index + 1}: [{corner.lat.toFixed(6)}, {corner.lng.toFixed(6)}]
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Safe Spots</h4>
                <div className="space-y-1 text-sm font-mono">
                  {jetsonData.safeSpots.map((spot, index) => {
                    const spotCoords = gpsToFieldCoords(spot, jetsonData.arena)
                    return (
                      <div key={index} className="bg-green-50 p-2 rounded">
                        <div className="font-medium">{spot.id}</div>
                        <div className="text-xs">Field: ({spotCoords.x.toFixed(1)}m, {spotCoords.y.toFixed(1)}m)</div>
                        <div className="text-xs">GPS: [{spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}]</div>
                      </div>
                    )
                  })}
                </div>
                
                {/* Competition Reference */}
                <div className="mt-3 p-2 bg-blue-50 rounded border-l-4 border-blue-500">
                  <div className="text-xs font-semibold mb-1">Competition Specification:</div>
                  <div className="text-xs space-y-1">
                    <div>SafeSpot1: (3.5m, 7m) - Top-left area</div>
                    <div>SafeSpot2: (9.5m, 7m) - Top-right area</div>
                    <div>SafeSpot3: (9.5m, 2.5m) - Bottom-right area</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t text-xs text-muted-foreground">
              Data timestamp: {new Date(jetsonData.timestamp).toLocaleString()} | 
              Auto-refresh: Every 30 seconds | 
              Source: jetson123@10.0.2.219:/home/nvidia/safe_zone_data.txt
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}