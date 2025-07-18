"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Enhanced3DView } from "@/components/enhanced-3d-view"
import { AttitudeVisualizer } from "@/components/attitude-visualizer"
import ColoredGridWithSprites from "@/components/ColoredGridWithSprites"

export default function VisualizationPage() {
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0, z: 0 })
  const [positionHistory, setPositionHistory] = useState<{x: number, y: number, z: number}[]>([])

  // Fetch real-time position data
  useEffect(() => {
    const fetchPositionData = async () => {
      try {
        const localResponse = await fetch(`/params/local_position_ned.json?t=${Date.now()}`)
        
        if (localResponse.ok) {
          const localData = await localResponse.json()
          if (localData && typeof localData.x === 'number' && typeof localData.y === 'number') {
            const newPos = {
              x: localData.x,
              y: localData.y,
              z: -localData.z // Invert Z for intuitive display
            }
            
            setCurrentPosition(newPos)
            
            // Update position history for trail effect
            setPositionHistory(prev => {
              const newHistory = [...prev, newPos]
              return newHistory.slice(-50) // Keep last 50 positions
            })
          }
        }
      } catch (error) {
        console.error('Error fetching position data:', error)
      }
    }

    fetchPositionData()
    const intervalId = setInterval(fetchPositionData, 250)
    return () => clearInterval(intervalId)
  }, [])

  const samplePositions = positionHistory.map((pos, index) => ({
    x: pos.x,
    y: pos.y,
    z: pos.z,
    time: Date.now() + index * 1000
  }))

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🎯 Enhanced 3D Visualization</h1>
        <div className="text-sm text-muted-foreground">
          Current Position: X: {currentPosition.x.toFixed(2)}m, Y: {currentPosition.y.toFixed(2)}m, Z: {currentPosition.z.toFixed(2)}m
        </div>
      </div>

      {/* Enhanced 3D View - TOP PRIORITY */}
      <Card>
        <CardHeader>
          <CardTitle>Enhanced 3D Visualization with 4-Quadrant View</CardTitle>
          <div className="text-sm text-muted-foreground">
            Real-time 3D drone position and trajectory visualization with extended range (-9 to +9, -12 to +12)
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Enhanced3DView />
        </CardContent>
      </Card>

      {/* 4-Quadrant Grid Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>4-Quadrant Position Grid (-9 to +9, -12 to +12)</CardTitle>
          <div className="text-sm text-muted-foreground">
            Extended visualization showing full operational area with quadrant divisions
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="aspect-[3/2] relative bg-gray-50 dark:bg-gray-950 border">
            <svg width="100%" height="100%" viewBox="-10 -13 20 26" className="absolute inset-0" preserveAspectRatio="xMidYMid meet">
              {/* Grid lines */}
              {/* Vertical grid lines */}
              {Array.from({length: 19}, (_, i) => i - 9).map(x => (
                <line key={`v${x}`} x1={x} y1="-12" x2={x} y2="12" 
                      className={x === 0 ? "stroke-red-500 stroke-[0.1]" : "stroke-gray-300 dark:stroke-gray-600 stroke-[0.02]"} />
              ))}
              
              {/* Horizontal grid lines */}
              {Array.from({length: 25}, (_, i) => i - 12).map(y => (
                <line key={`h${y}`} x1="-9" y1={y} x2="9" y2={y} 
                      className={y === 0 ? "stroke-red-500 stroke-[0.1]" : "stroke-gray-300 dark:stroke-gray-600 stroke-[0.02]"} />
              ))}
              
              {/* Quadrant labels */}
              <text x="4.5" y="-6" textAnchor="middle" fontSize="0.8" className="fill-blue-600 dark:fill-blue-400" fontWeight="bold">
                Quadrant I (+X, +Y)
              </text>
              <text x="-4.5" y="-6" textAnchor="middle" fontSize="0.8" className="fill-green-600 dark:fill-green-400" fontWeight="bold">
                Quadrant II (-X, +Y)
              </text>
              <text x="-4.5" y="6" textAnchor="middle" fontSize="0.8" className="fill-orange-600 dark:fill-orange-400" fontWeight="bold">
                Quadrant III (-X, -Y)
              </text>
              <text x="4.5" y="6" textAnchor="middle" fontSize="0.8" className="fill-purple-600 dark:fill-purple-400" fontWeight="bold">
                Quadrant IV (+X, -Y)
              </text>
              
              {/* Quadrant background colors */}
              <rect x="0" y="-12" width="9" height="12" fill="rgba(59, 130, 246, 0.1)" /> {/* Quadrant I */}
              <rect x="-9" y="-12" width="9" height="12" fill="rgba(34, 197, 94, 0.1)" /> {/* Quadrant II */}
              <rect x="-9" y="0" width="9" height="12" fill="rgba(249, 115, 22, 0.1)" /> {/* Quadrant III */}
              <rect x="0" y="0" width="9" height="12" fill="rgba(168, 85, 247, 0.1)" /> {/* Quadrant IV */}
              
              {/* Boundary markers */}
              <rect x="-9" y="-12" width="18" height="24" fill="none" stroke="#000" strokeWidth="0.2" strokeDasharray="0.5,0.2"/>
              
              {/* Position trail */}
              {positionHistory.length > 1 && (
                <g>
                  <polyline
                    points={positionHistory.map(pos => `${pos.x},${-pos.y}`).join(' ')}
                    fill="none"
                    stroke="#ff6666"
                    strokeWidth="0.1"
                    opacity="0.7"
                    strokeDasharray="0.2,0.1"
                  />
                  {positionHistory.slice(0, -1).map((pos, index) => (
                    <circle
                      key={index}
                      cx={pos.x}
                      cy={-pos.y}
                      r="0.15"
                      fill="#ff9999"
                      opacity={0.3 + (index / positionHistory.length) * 0.4}
                    />
                  ))}
                </g>
              )}
              
              {/* Current drone position */}
              <g>
                <circle 
                  cx={currentPosition.x} 
                  cy={-currentPosition.y} 
                  r="0.8" 
                  fill="rgba(255,0,0,0.3)"
                  stroke="none"
                />
                <circle 
                  cx={currentPosition.x} 
                  cy={-currentPosition.y} 
                  r="0.5" 
                  fill="#ff0000"
                  stroke="#000000"
                  strokeWidth="0.1"
                />
                <circle 
                  cx={currentPosition.x} 
                  cy={-currentPosition.y} 
                  r="0.25" 
                  fill="#ffff00"
                  stroke="#000000"
                  strokeWidth="0.05"
                />
                
                {/* Pulse animation circle */}
                <circle 
                  cx={currentPosition.x} 
                  cy={-currentPosition.y} 
                  r="0.6" 
                  fill="none"
                  stroke="#ff0000"
                  strokeWidth="0.05"
                  opacity="0.6"
                >
                  <animate attributeName="r" values="0.6;1.2;0.6" dur="2s" repeatCount="indefinite"/>
                  <animate attributeName="opacity" values="0.6;0;0.6" dur="2s" repeatCount="indefinite"/>
                </circle>
                
                {/* Position coordinates label */}
                <text 
                  x={currentPosition.x} 
                  y={-currentPosition.y - 1.2} 
                  textAnchor="middle" 
                  fontSize="0.4"
                  className="fill-black dark:fill-white"
                  fontWeight="bold"
                >
                  ({currentPosition.x.toFixed(1)}, {currentPosition.y.toFixed(1)}, {currentPosition.z.toFixed(1)})
                </text>
              </g>
              
              {/* Axis labels */}
              <text x="8.5" y="0.3" textAnchor="middle" fontSize="0.5" className="fill-black dark:fill-white" fontWeight="bold">
                +X
              </text>
              <text x="-8.5" y="0.3" textAnchor="middle" fontSize="0.5" className="fill-black dark:fill-white" fontWeight="bold">
                -X
              </text>
              <text x="0.3" y="-11.5" textAnchor="middle" fontSize="0.5" className="fill-black dark:fill-white" fontWeight="bold">
                +Y
              </text>
              <text x="0.3" y="11.8" textAnchor="middle" fontSize="0.5" className="fill-black dark:fill-white" fontWeight="bold">
                -Y
              </text>
              
              {/* Scale markers */}
              {Array.from({length: 5}, (_, i) => (i + 1) * 2).map(val => (
                <g key={val}>
                  <text x={val} y="0.8" textAnchor="middle" fontSize="0.3" className="fill-gray-600 dark:fill-gray-400">
                    {val}m
                  </text>
                  <text x={-val} y="0.8" textAnchor="middle" fontSize="0.3" className="fill-gray-600 dark:fill-gray-400">
                    {-val}m
                  </text>
                </g>
              ))}
              
              {Array.from({length: 3}, (_, i) => (i + 1) * 4).map(val => (
                <g key={val}>
                  <text x="0.8" y={-val} textAnchor="middle" fontSize="0.3" className="fill-gray-600 dark:fill-gray-400">
                    {val}m
                  </text>
                  <text x="0.8" y={val} textAnchor="middle" fontSize="0.3" className="fill-gray-600 dark:fill-gray-400">
                    {-val}m
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Attitude Visualizer</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <AttitudeVisualizer />
          </CardContent>
        </Card>
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>3D Trail Visualization</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ColoredGridWithSprites positions={samplePositions} />
          </CardContent>
        </Card>
      </div>
      
      {/* Quadrant Statistics */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-blue-700 dark:text-blue-300">Quadrant I (+X, +Y)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-blue-800 dark:text-blue-200">
              {currentPosition.x >= 0 && currentPosition.y >= 0 ? '🎯 ACTIVE' : 'Inactive'}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400">
              Range: 0→9m, 0→12m
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-green-700 dark:text-green-300">Quadrant II (-X, +Y)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-green-800 dark:text-green-200">
              {currentPosition.x < 0 && currentPosition.y >= 0 ? '🎯 ACTIVE' : 'Inactive'}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400">
              Range: -9→0m, 0→12m
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50 dark:bg-orange-950 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-orange-700 dark:text-orange-300">Quadrant III (-X, -Y)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-orange-800 dark:text-orange-200">
              {currentPosition.x < 0 && currentPosition.y < 0 ? '🎯 ACTIVE' : 'Inactive'}
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400">
              Range: -9→0m, -12→0m
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-purple-700 dark:text-purple-300">Quadrant IV (+X, -Y)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold text-purple-800 dark:text-purple-200">
              {currentPosition.x >= 0 && currentPosition.y < 0 ? '🎯 ACTIVE' : 'Inactive'}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400">
              Range: 0→9m, -12→0m
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
