"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

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

export default function SafeSpotsPage() {
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })
  const [detectedSpots, setDetectedSpots] = useState<number[]>([])
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [positionHistory, setPositionHistory] = useState<{x: number, y: number}[]>([])
  const simulatorRef = useRef(new PositionSimulator())
  
  // Safe spot coordinates based on the diagram (in meters)
  const safeSpots = [
    { id: 1, name: "Safe Spot Alpha", x: 3.5, y: 6.5 },
    { id: 2, name: "Safe Spot Beta", x: 2.0, y: 9.0 },
    { id: 3, name: "Safe Spot Gamma", x: 6.5, y: 9.0 },
    { id: 4, name: "Home Base", x: 8.4, y: 1.6 }
  ]

  // Detection threshold (0.5 meters)
  const DETECTION_THRESHOLD = 0.5

  // Calculate distance between two points
  const calculateDistance = (pos1: {x: number, y: number}, pos2: {x: number, y: number}) => {
    return Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))
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
            // Scale the real coordinates to fit within the 9x12m field
            const fieldX = Math.max(0, Math.min(9, localData.x * 0.5 + 4.5)); // Scale and center
            const fieldY = Math.max(0, Math.min(12, localData.y * 0.5 + 6));   // Scale and center
            
            setCurrentPosition({ x: fieldX, y: fieldY })
            setConnectionStatus(`Live Data - NED (${localData.time_boot_ms}ms)`)
            
            // Update position history for trail effect
            setPositionHistory(prev => {
              const newHistory = [...prev, { x: fieldX, y: fieldY }]
              return newHistory.slice(-10) // Keep last 10 positions
            })
            
            return
          }
        }

        // Fallback to GLOBAL_POSITION_INT if LOCAL_POSITION_NED fails
        const globalResponse = await fetch(`/params/global_position_int.json?t=${Date.now()}`)
        
        if (globalResponse.ok) {
          const globalData = await globalResponse.json()
          if (globalData && (globalData.lat !== 0 || globalData.lon !== 0)) {
            // Convert GPS to field coordinates using relative movement
            const fieldX = Math.max(0, Math.min(9, (globalData.lat / 1000000) % 9));
            const fieldY = Math.max(0, Math.min(12, (globalData.lon / 1000000) % 12));
            
            setCurrentPosition({ x: fieldX, y: fieldY })
            setConnectionStatus(`GPS Data - Global (${globalData.time_boot_ms}ms)`)
            
            // Update position history for trail effect
            setPositionHistory(prev => {
              const newHistory = [...prev, { x: fieldX, y: fieldY }]
              return newHistory.slice(-10) // Keep last 10 positions
            })
            
            return
          }
        }

        // If both fail, use simulated data
        throw new Error('No real data available')

      } catch (error) {
        console.error('Error fetching position data:', error)
        // Use simulated data as fallback
        const simulatedPos = simulatorRef.current.update()
        setCurrentPosition(simulatedPos)
        setConnectionStatus('Simulated Data')
        
        // Update position history for simulated data too
        setPositionHistory(prev => {
          const newHistory = [...prev, simulatedPos]
          return newHistory.slice(-10) // Keep last 10 positions
        })
      }
    }

    // Initial fetch
    fetchPositionData()

    // Set up interval for very fast updates (4Hz for live feeling)
    const intervalId = setInterval(fetchPositionData, 250) // Update every 250ms for fast response

    // Clean up interval on component unmount
    return () => clearInterval(intervalId)
  }, [])

  // Check if drone is at any safe spot
  useEffect(() => {
    safeSpots.forEach(spot => {
      const distance = calculateDistance(currentPosition, spot)
      if (distance <= DETECTION_THRESHOLD && !detectedSpots.includes(spot.id)) {
        setDetectedSpots(prev => [...prev, spot.id])
        
        // Professional notification for safe spot detection
        console.log(`🎯 ${spot.name} Detected! Distance: ${distance.toFixed(2)}m`)
        
        // You can replace this with a toast notification or other UI feedback
        alert(`🎯 SAFE SPOT DETECTED!\n\n${spot.name}\nDistance: ${distance.toFixed(2)}m\nPosition: (${spot.x}, ${spot.y})`)
      }
    })
  }, [currentPosition, detectedSpots])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🛡️ Safe Spot Detection System</h1>
        <div className="text-sm text-muted-foreground">
          Detection Range: {DETECTION_THRESHOLD}m
        </div>
      </div>

      {/* Connection Status Bar */}
      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${
                connectionStatus.includes('Connected') ? 'bg-green-500' : 'bg-red-500'
              }`} />
              <span className="font-medium">Status: {connectionStatus}</span>
            </div>
            <div className="text-sm font-mono">
              Position: X: {currentPosition.x.toFixed(3)}m, Y: {currentPosition.y.toFixed(3)}m
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Field Visualization */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Field Layout</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="aspect-[3/4] relative bg-green-50 border">
              <svg width="100%" height="100%" viewBox="0 0 9 12" className="absolute inset-0">
                {/* Field boundary */}
                <rect x="0" y="0" width="9" height="12" fill="#e8f5e8" stroke="#000" strokeWidth="0.1"/>
                
                {/* Grid lines for better visualization */}
                {[1,2,3,4,5,6,7,8].map(i => (
                  <line key={`v${i}`} x1={i} y1="0" x2={i} y2="12" stroke="#ddd" strokeWidth="0.02"/>
                ))}
                {[1,2,3,4,5,6,7,8,9,10,11].map(i => (
                  <line key={`h${i}`} x1="0" y1={i} x2="9" y2={i} stroke="#ddd" strokeWidth="0.02"/>
                ))}
                
                {/* Safe spots */}
                {safeSpots.map(spot => (
                  <g key={spot.id}>
                    {/* Detection radius circle */}
                    <circle 
                      cx={spot.x} 
                      cy={12 - spot.y} 
                      r={DETECTION_THRESHOLD}
                      fill={detectedSpots.includes(spot.id) ? "rgba(0,255,0,0.2)" : "rgba(0,102,204,0.1)"}
                      stroke={detectedSpots.includes(spot.id) ? "#00ff00" : "#0066cc"}
                      strokeWidth="0.03"
                      strokeDasharray="0.1,0.1"
                    />
                    
                    {/* Safe spot marker */}
                    <rect 
                      x={spot.x - 0.3} 
                      y={12 - spot.y - 0.3} 
                      width="0.6" 
                      height="0.6" 
                      fill={detectedSpots.includes(spot.id) ? "#00ff00" : "#0066cc"}
                      stroke="#000"
                      strokeWidth="0.02"
                    />
                    
                    {/* Spot label */}
                    <text 
                      x={spot.x} 
                      y={12 - spot.y + 0.8} 
                      textAnchor="middle" 
                      fontSize="0.3"
                      fill="#000"
                      fontWeight="bold"
                    >
                      {spot.name}
                    </text>
                  </g>
                ))}
                
                {/* Position trail */}
                {positionHistory.length > 1 && (
                  <g>
                    {/* Trail line */}
                    <polyline
                      points={positionHistory.map(pos => `${pos.x},${12 - pos.y}`).join(' ')}
                      fill="none"
                      stroke="#ff6666"
                      strokeWidth="0.05"
                      opacity="0.7"
                      strokeDasharray="0.1,0.05"
                    />
                    
                    {/* Trail dots */}
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
                  {/* Outer glow circle for visibility */}
                  <circle 
                    cx={currentPosition.x} 
                    cy={12 - currentPosition.y} 
                    r="0.4" 
                    fill="rgba(255,0,0,0.3)"
                    stroke="none"
                  />
                  
                  {/* Main drone body - bright red */}
                  <circle 
                    cx={currentPosition.x} 
                    cy={12 - currentPosition.y} 
                    r="0.25" 
                    fill="#ff0000"
                    stroke="#000000"
                    strokeWidth="0.05"
                  />
                  
                  {/* Inner highlight - bright yellow for contrast */}
                  <circle 
                    cx={currentPosition.x} 
                    cy={12 - currentPosition.y} 
                    r="0.12" 
                    fill="#ffff00"
                    stroke="#000000"
                    strokeWidth="0.02"
                  />
                  
                  {/* Drone label with background */}
                  <rect
                    x={currentPosition.x - 0.6}
                    y={12 - currentPosition.y - 0.8}
                    width="1.2"
                    height="0.3"
                    fill="rgba(0,0,0,0.8)"
                    rx="0.05"
                  />
                  <text 
                    x={currentPosition.x} 
                    y={12 - currentPosition.y - 0.6} 
                    textAnchor="middle" 
                    fontSize="0.2"
                    fill="#ffffff"
                    fontWeight="bold"
                  >
                    DRONE
                  </text>
                  
                  {/* Pulse animation circle */}
                  <circle 
                    cx={currentPosition.x} 
                    cy={12 - currentPosition.y} 
                    r="0.3" 
                    fill="none"
                    stroke="#ff0000"
                    strokeWidth="0.03"
                    opacity="0.6"
                  >
                    <animate attributeName="r" values="0.3;0.6;0.3" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
                  </circle>
                </g>
                
                {/* Dimensions */}
                <text x="4.5" y="0.5" textAnchor="middle" fontSize="0.3" fill="#666">
                  9m (≈ 30 ft.)
                </text>
                <text x="0.5" y="6" textAnchor="middle" fontSize="0.3" fill="#666" 
                      transform="rotate(-90, 0.5, 6)">
                  12m (≈ 40 ft.)
                </text>
              </svg>
            </div>
          </CardContent>
        </Card>

        {/* Control Panel */}
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Live Monitoring</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
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
                Detected: {detectedSpots.length}/{safeSpots.length} safe spots
                <br />
                Detection Threshold: {DETECTION_THRESHOLD}m radius
              </AlertDescription>
            </Alert>

            {/* Safe Spots Status */}
            <div>
              <h3 className="text-lg font-semibold mb-3">Safe Spots Status</h3>
              <div className="space-y-3">
                {safeSpots.map(spot => {
                  const distance = calculateDistance(currentPosition, spot);
                  const isDetected = detectedSpots.includes(spot.id);
                  
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
                            <div className="font-medium">{spot.name}</div>
                            <div className="text-sm text-muted-foreground font-mono">
                              ({spot.x}, {spot.y}) • Distance: {distance.toFixed(2)}m
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
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Current Drone Position</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-600"></div>
              <span>Safe Spot (Pending)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500"></div>
              <span>Safe Spot (Detected)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 border-2 border-dashed border-blue-400 rounded-full"></div>
              <span>Detection Range (0.5m radius)</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
