"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Wifi, WifiOff, MapPin, Clock, Shield, Target } from "lucide-react"

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
  const [currentPosition, setCurrentPosition] = useState({ x: 4.5, y: 6 })
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
      setMockActive(useMockData)
      
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

  // Auto-fetch Jetson data
  useEffect(() => {
    fetchJetsonData(true) // Initial fetch with mock data
    
    const interval = setInterval(() => {
      if (!mockActive) {
        fetchJetsonData() // Real SCP fetch every 30 seconds only if not in mock mode
      }
    }, 30000)

    return () => clearInterval(interval)
  }, [mockActive])

  // Compute field bounds including both arena and safe spots
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

  // Position tracking
  useEffect(() => {
    const updatePosition = () => {
      if (mockActive) {
        const newPos = simulatorRef.current.update()
        setCurrentPosition(newPos)
        setPositionHistory(prev => [...prev.slice(-9), newPos])
        setConnectionStatus('Mock Simulation Active')
      }
    }

    const interval = setInterval(updatePosition, 100)
    return () => clearInterval(interval)
  }, [mockActive])

  // Check for safe spot detection
  useEffect(() => {
    if (!jetsonData?.safeSpots) return

    jetsonData.safeSpots.forEach(spot => {
      const spotFieldCoords = getFieldCoords(spot, fieldBounds)
      const distance = calculateDistance(currentPosition, spotFieldCoords)
      
      if (distance <= DETECTION_THRESHOLD && !detectedSpots.includes(spot.id)) {
        setDetectedSpots(prev => [...prev, spot.id])
        console.log(`🎯 ${spot.id} Detected!`)
      }
    })
  }, [currentPosition, jetsonData, detectedSpots, fieldBounds])

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Shield className="w-8 h-8 text-cyan-500" />
            Safe Spot Detection System
          </h1>
          <p className="text-muted-foreground mt-1">
            Real-time arena monitoring and safe landing zone identification
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Badge variant={jetsonStatus === 'connected' ? 'default' : mockActive ? 'secondary' : 'destructive'} className="flex items-center gap-1">
            {jetsonStatus === 'connected' ? <Wifi className="w-4 h-4" /> : <WifiOff className="w-4 h-4" />}
            {mockActive ? 'Mock Mode' : `Jetson ${jetsonStatus}`}
          </Badge>
          <Button
            onClick={() => fetchJetsonData(false)}
            disabled={loading}
            size="sm"
            variant="outline"
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Live Data
          </Button>
          <Button
            onClick={() => fetchJetsonData(true)}
            variant={mockActive ? "default" : "outline"}
            size="sm"
          >
            <Target className="w-4 h-4 mr-2" />
            Demo Mode
          </Button>
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900">
                <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Arena Size</p>
                <p className="text-2xl font-bold">9×12m</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900">
                <Shield className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Safe Spots</p>
                <p className="text-2xl font-bold">{jetsonData?.safeSpots?.length || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900">
                <Target className="h-6 w-6 text-cyan-600 dark:text-cyan-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Detected</p>
                <p className="text-2xl font-bold">{detectedSpots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900">
                <Clock className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Update</p>
                <p className="text-lg font-bold">{lastJetsonUpdate || 'Never'}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Arena Visualization */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5" />
              Live Arena Map
            </CardTitle>
            <div className="text-sm text-muted-foreground flex items-center gap-2">
              Arena: {jetsonData?.arena?.length || 0} corners • Safe Spots: {jetsonData?.safeSpots?.length || 0} detected
              {mockActive && (
                <Badge variant="secondary" className="ml-2 animate-pulse">
                  DEMO MODE
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-[3/4] relative bg-gradient-to-br from-green-50 to-blue-50 dark:from-neutral-900 dark:to-neutral-800 border dark:border-neutral-700 rounded-lg overflow-hidden">
              <svg width="100%" height="100%" viewBox="0 0 9 12" className="absolute inset-0">
                {/* Field boundary */}
                <rect 
                  x="0" y="0" width="9" height="12" 
                  fill="transparent" 
                  stroke="#10b981" 
                  strokeWidth="0.05"
                  className="dark:stroke-green-400"
                />
                
                {/* Grid lines */}
                {[1,2,3,4,5,6,7,8].map(i => (
                  <line 
                    key={`v${i}`} 
                    x1={i} y1="0" x2={i} y2="12" 
                    stroke="#d1d5db" 
                    strokeWidth="0.02"
                    className="dark:stroke-neutral-600"
                  />
                ))}
                {[1,2,3,4,5,6,7,8,9,10,11].map(i => (
                  <line 
                    key={`h${i}`} 
                    x1="0" y1={i} x2="9" y2={i} 
                    stroke="#d1d5db" 
                    strokeWidth="0.02"
                    className="dark:stroke-neutral-600"
                  />
                ))}
                
                {/* Arena boundary */}
                {arenaFieldCoords.length >= 4 && (
                  <g>
                    <polygon
                      points={arenaFieldCoords.map(p => `${p.x},${12 - p.y}`).join(' ')}
                      fill="rgba(34, 197, 94, 0.1)"
                      stroke="#22c55e"
                      strokeWidth="0.1"
                      strokeDasharray="0.2,0.1"
                      className="dark:fill-green-400/10 dark:stroke-green-400"
                    />
                    {arenaFieldCoords.map((corner, index) => (
                      <circle
                        key={index}
                        cx={corner.x}
                        cy={12 - corner.y}
                        r="0.15"
                        fill="#22c55e"
                        stroke="#ffffff"
                        strokeWidth="0.05"
                        className="dark:fill-green-400 dark:stroke-white"
                      />
                    ))}
                  </g>
                )}
                
                {/* Safe Spots */}
                {safeSpotFieldCoords.map((spot, idx) => {
                  const spotId = jetsonData?.safeSpots?.[idx]?.id || `Spot${idx + 1}`
                  const isDetected = detectedSpots.includes(spotId)
                  
                  return (
                    <g key={idx}>
                      {/* Safe spot glow effect */}
                      <circle
                        cx={spot.x}
                        cy={12 - spot.y}
                        r="0.4"
                        fill={isDetected ? "rgba(6, 182, 212, 0.2)" : "rgba(6, 182, 212, 0.1)"}
                        className={isDetected ? "animate-pulse" : ""}
                      />
                      {/* Safe spot marker */}
                      <circle
                        cx={spot.x}
                        cy={12 - spot.y}
                        r="0.2"
                        fill={isDetected ? "#06b6d4" : "#0891b2"}
                        stroke="#ffffff"
                        strokeWidth="0.05"
                        className={`dark:fill-cyan-400 dark:stroke-white ${isDetected ? 'animate-pulse' : ''}`}
                      />
                      {/* Safe spot label */}
                      <text
                        x={spot.x}
                        y={12 - spot.y - 0.4}
                        textAnchor="middle"
                        fontSize="0.25"
                        fill="#374151"
                        className="dark:fill-white font-bold"
                      >
                        {spotId}
                      </text>
                    </g>
                  )
                })}
                
                {/* Drone marker */}
                <g>
                  {/* Drone position indicator */}
                  <circle
                    cx={currentPosition.x}
                    cy={12 - currentPosition.y}
                    r="0.3"
                    fill="rgba(239, 68, 68, 0.2)"
                    className="animate-ping"
                  />
                  <polygon
                    points="0,-0.2 0.15,0.15 -0.15,0.15"
                    transform={`translate(${currentPosition.x},${12 - currentPosition.y}) scale(1.5)`}
                    fill="#ef4444"
                    stroke="#ffffff"
                    strokeWidth="0.03"
                    className="dark:fill-red-400 dark:stroke-white"
                  />
                </g>
                
                {/* Position trail */}
                {positionHistory.length > 1 && (
                  <polyline
                    points={positionHistory.map(pos => `${pos.x},${12 - pos.y}`).join(' ')}
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="0.05"
                    opacity="0.6"
                    strokeDasharray="0.1,0.1"
                    className="dark:stroke-red-400"
                  />
                )}
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Safe Spots Panel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Safe Spots Status
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Current Position */}
            <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-lg border dark:border-neutral-700">
              <h3 className="font-semibold mb-2 flex items-center gap-2">
                <Target className="w-4 h-4" />
                Current Position
              </h3>
              <div className="grid grid-cols-2 gap-2 text-sm font-mono">
                <div>X: <span className="font-bold">{currentPosition.x.toFixed(2)}m</span></div>
                <div>Y: <span className="font-bold">{currentPosition.y.toFixed(2)}m</span></div>
              </div>
              <div className="text-xs text-muted-foreground mt-2">
                Status: {connectionStatus}
              </div>
            </div>

            {/* Safe Spots List */}
            {jetsonData?.safeSpots && (
              <div>
                <h3 className="font-semibold mb-3">Detected Safe Spots</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {jetsonData.safeSpots.map(spot => {
                    const spotCoords = getFieldCoords(spot, fieldBounds)
                    const distance = calculateDistance(currentPosition, spotCoords)
                    const isDetected = detectedSpots.includes(spot.id)
                    
                    return (
                      <div 
                        key={spot.id} 
                        className={`p-4 border rounded-lg transition-all duration-300 ${
                          isDetected 
                            ? 'border-cyan-500 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-950 dark:to-blue-950 shadow-lg' 
                            : 'border-gray-200 dark:border-neutral-700 bg-white dark:bg-neutral-800 hover:shadow-md'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <div className={`w-3 h-3 rounded-full ${
                              isDetected ? 'bg-cyan-500 animate-pulse' : 'bg-gray-300 dark:bg-neutral-600'
                            }`} />
                            <div>
                              <div className="font-semibold text-sm">{spot.id}</div>
                              <div className="text-xs text-muted-foreground">
                                Safe Landing Zone
                              </div>
                            </div>
                          </div>
                          <div className={`px-2 py-1 rounded text-xs font-bold ${
                            isDetected 
                              ? 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200' 
                              : 'bg-gray-100 text-gray-600 dark:bg-neutral-700 dark:text-neutral-300'
                          }`}>
                            {isDetected ? '✓ DETECTED' : `${distance.toFixed(1)}m away`}
                          </div>
                        </div>
                        <div className="text-xs font-mono text-muted-foreground">
                          GPS: {spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Detection Summary */}
            <Alert className="border-cyan-200 dark:border-cyan-800">
              <Target className="h-4 w-4" />
              <AlertTitle>Detection Summary</AlertTitle>
              <AlertDescription>
                {detectedSpots.length} of {jetsonData?.safeSpots?.length || 0} safe spots detected
                <br />
                Detection range: {DETECTION_THRESHOLD}m radius
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </div>

      {/* Raw Data Section */}
      {jetsonData && (
        <Card>
          <CardHeader>
            <CardTitle>Raw GPS Data from Jetson</CardTitle>
            <div className="text-sm text-muted-foreground">
              Data source: jetson123@10.0.2.219:/home/nvidia/safe_zone_data.txt
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  Arena Corners
                </h4>
                <div className="space-y-2">
                  {jetsonData.arena.map((corner, index) => (
                    <div key={index} className="bg-green-50 dark:bg-green-950 p-3 rounded-lg border dark:border-green-800">
                      <div className="font-mono text-sm">
                        <strong>Corner {index + 1}:</strong> [{corner.lat.toFixed(6)}, {corner.lng.toFixed(6)}]
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Safe Spots
                </h4>
                <div className="space-y-2">
                  {jetsonData.safeSpots.map((spot, index) => (
                    <div key={index} className="bg-cyan-50 dark:bg-cyan-950 p-3 rounded-lg border dark:border-cyan-800">
                      <div className="font-mono text-sm">
                        <strong>{spot.id}:</strong> [{spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}]
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-6 pt-4 border-t dark:border-neutral-700 text-xs text-muted-foreground">
              <div className="grid md:grid-cols-3 gap-4">
                <div>Data timestamp: {new Date(jetsonData.timestamp).toLocaleString()}</div>
                <div>Auto-refresh: Every 30 seconds</div>
                <div>Status: {jetsonData.status === 'success' ? '✅ Active' : '❌ Error'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
