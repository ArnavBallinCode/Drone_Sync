"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Wifi, WifiOff, MapPin, Clock } from "lucide-react"

// Position data simulator for fallback
class PositionSimulator {
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
  const [mockActive, setMockActive] = useState(false)
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
      setMockActive(!!useMockData)
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
        setDetectedSpots(prev => [...prev, spot.id])
        
        console.log(`🎯 ${spot.id} Detected! Distance: ${distance.toFixed(2)}m`)
        alert(`🎯 SAFE SPOT DETECTED!\n\n${spot.id}\nDistance: ${distance.toFixed(2)}m\nGPS: (${spot.lat.toFixed(6)}, ${spot.lng.toFixed(6)})`)
      }
    })
  }, [currentPosition, jetsonData, detectedSpots])

  // Compute min/max lat/lng including both arena and safe spots
  const getFieldBounds = () => {
    if (!jetsonData) return null;
    const allPoints = [
      ...(jetsonData.arena || []),
      ...(jetsonData.safeSpots || [])
    ];
    if (allPoints.length === 0) return null;
    const minLat = Math.min(...allPoints.map(c => c.lat));
    const maxLat = Math.max(...allPoints.map(c => c.lat));
    const minLng = Math.min(...allPoints.map(c => c.lng));
    const maxLng = Math.max(...allPoints.map(c => c.lng));
    return { minLat, maxLat, minLng, maxLng };
  };

  // Convert GPS to field coordinates based on all points
  const getFieldCoords = (point: { lat: number, lng: number }, bounds: any) => {
    if (!bounds) return { x: 0, y: 0 };
    const { minLat, maxLat, minLng, maxLng } = bounds;
    return {
      x: ((point.lng - minLng) / (maxLng - minLng || 1)) * 9,
      y: ((point.lat - minLat) / (maxLat - minLat || 1)) * 12
    };
  };

  const fieldBounds = getFieldBounds();
  const arenaFieldCoords = jetsonData?.arena?.map(corner => getFieldCoords(corner, fieldBounds)) || [];
  const safeSpotFieldCoords = jetsonData?.safeSpots?.map(spot => getFieldCoords(spot, fieldBounds)) || [];

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
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Arena: {jetsonData?.arena?.length || 0} corners • Safe Spots: {jetsonData?.safeSpots?.length || 0} detected
              {mockActive && (
                <span className="ml-2 px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200 text-xs font-bold animate-pulse">MOCK DATA</span>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-[3/4] relative bg-green-50 dark:bg-neutral-900 border dark:border-neutral-700">
              <svg width="100%" height="100%" viewBox="0 0 9 12" className="absolute inset-0">
                {/* Field boundary */}
                <rect x="0" y="0" width="9" height="12" fill="#e8f5e8" stroke="#000" strokeWidth="0.1" className="dark:fill-neutral-900 dark:stroke-neutral-600"/>
                {/* Grid lines */}
                {[1,2,3,4,5,6,7,8].map(i => (
                  <line key={`v${i}`} x1={i} y1="0" x2={i} y2="12" stroke="#ddd" strokeWidth="0.02" className="dark:stroke-neutral-700"/>
                ))}
                {[1,2,3,4,5,6,7,8,9,10,11].map(i => (
                  <line key={`h${i}`} x1="0" y1={i} x2="9" y2={i} stroke="#ddd" strokeWidth="0.02" className="dark:stroke-neutral-700"/>
                ))}
                
                {/* Dynamic Arena from Jetson */}
                {arenaFieldCoords.length >= 4 && (
                  <g>
                    <polygon
                      points={arenaFieldCoords.map(p => `${p.x},${12 - p.y}`).join(' ')}
                      fill="rgba(255,215,0,0.1)"
                      stroke="#FFD700"
                      strokeWidth="0.1"
                      strokeDasharray="0.2,0.1"
                      className="dark:stroke-yellow-400"
                    />
                    {arenaFieldCoords.map((corner, index) => (
                      <circle
                        key={index}
                        cx={corner.x}
                        cy={12 - corner.y}
                        r="0.15"
                        fill="#FFD700"
                        stroke="#000"
                        strokeWidth="0.02"
                        className="dark:fill-yellow-400 dark:stroke-neutral-200"
                      />
                    ))}
                  </g>
                )}
                
                {/* Safe Spots */}
                {safeSpotFieldCoords.map((spot, idx) => (
                  <rect
                    key={idx}
                    x={spot.x - 0.25}
                    y={12 - spot.y - 0.25}
                    width="0.5"
                    height="0.5"
                    rx="0.1"
                    fill="#00bcd4"
                    stroke="#000"
                    strokeWidth="0.03"
                    className="dark:fill-cyan-400 dark:stroke-neutral-200"
                  />
                ))}
                {/* Drone marker for mock data */}
                {mockActive && (
                  <g className="animate-bounce">
                    <polygon
                      points="0,-0.3 0.2,0.2 -0.2,0.2"
                      transform={`translate(${currentPosition.x},${12 - currentPosition.y}) scale(1.2)`}
                      fill="#f43f5e"
                      stroke="#fff"
                      strokeWidth="0.05"
                      className="dark:fill-pink-400 dark:stroke-white"
                    />
                  </g>
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
            <Alert>
              <AlertTitle>🎯 Detection Summary</AlertTitle>
              <AlertDescription>
                Detected: {detectedSpots.length}/{jetsonData?.safeSpots?.length || 0} safe spots
                <br />
                Detection Threshold: {DETECTION_THRESHOLD}m radius
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
                      <div key={spot.id} className={`p-3 border rounded-lg transition-colors flex flex-col gap-1 \
                        ${isDetected ? 'border-green-500 bg-green-50 dark:bg-green-900' : 'border-gray-200 dark:border-neutral-700 dark:bg-neutral-800'}` }>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full \
                              ${isDetected ? 'bg-green-500' : 'bg-gray-300 dark:bg-neutral-600'}` } />
                            <div>
                              <div className="font-medium">{spot.id}</div>
                              <div className="text-xs text-muted-foreground font-mono">
                                Lat: {spot.lat.toFixed(6)}<br/>Lng: {spot.lng.toFixed(6)}
                              </div>
                            </div>
                          </div>
                          <div className="text-xs font-bold \
                            ${isDetected ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-300'}` }>
                            {isDetected ? 'Detected' : `${distance.toFixed(2)}m`}
                          </div>
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
                  {jetsonData.safeSpots.map((spot, index) => (
                    <div key={index} className="bg-green-50 p-2 rounded">
                      {spot.id}: [{spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}]
                    </div>
                  ))}
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
