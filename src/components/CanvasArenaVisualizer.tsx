"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

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

interface CanvasArenaVisualizerProps {
  data: JetsonData | null
}

const CanvasArenaVisualizer: React.FC<CanvasArenaVisualizerProps> = ({ data }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>()
  const [animationTime, setAnimationTime] = useState(0)

  // Convert GPS coordinates to canvas coordinates
  const gpsToCanvas = useCallback((coords: ArenaCorner[], canvasWidth: number, canvasHeight: number) => {
    if (coords.length === 0) return []
    
    const minLat = Math.min(...coords.map(c => c.lat))
    const maxLat = Math.max(...coords.map(c => c.lat))
    const minLng = Math.min(...coords.map(c => c.lng))
    const maxLng = Math.max(...coords.map(c => c.lng))
    
    const padding = 50
    const availableWidth = canvasWidth - 2 * padding
    const availableHeight = canvasHeight - 2 * padding
    
    return coords.map(coord => ({
      x: padding + ((coord.lng - minLng) / (maxLng - minLng)) * availableWidth,
      y: padding + ((maxLat - coord.lat) / (maxLat - minLat)) * availableHeight // Flip Y axis
    }))
  }, [])

  // Animation loop
  useEffect(() => {
    const animate = () => {
      setAnimationTime(prev => prev + 0.05)
      animationRef.current = requestAnimationFrame(animate)
    }
    
    animationRef.current = requestAnimationFrame(animate)
    
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current)
      }
    }
  }, [])

  // Draw on canvas
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || !data || data.status === 'error') return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const { width, height } = canvas
    
    // Clear canvas
    ctx.fillStyle = '#001122'
    ctx.fillRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = '#334455'
    ctx.lineWidth = 1
    for (let i = 0; i <= width; i += 20) {
      ctx.beginPath()
      ctx.moveTo(i, 0)
      ctx.lineTo(i, height)
      ctx.stroke()
    }
    for (let i = 0; i <= height; i += 20) {
      ctx.beginPath()
      ctx.moveTo(0, i)
      ctx.lineTo(width, i)
      ctx.stroke()
    }

    if (data.arena.length >= 4) {
      // Convert coordinates
      const allCoords = [...data.arena, ...data.safeSpots.map(s => ({ lat: s.lat, lng: s.lng }))]
      const canvasCoords = gpsToCanvas(allCoords, width, height)
      const arenaCoords = canvasCoords.slice(0, data.arena.length)
      const safeSpotCoords = canvasCoords.slice(data.arena.length)

      // Draw arena floor
      ctx.fillStyle = 'rgba(34, 139, 34, 0.2)'
      ctx.beginPath()
      arenaCoords.forEach((coord, index) => {
        if (index === 0) {
          ctx.moveTo(coord.x, coord.y)
        } else {
          ctx.lineTo(coord.x, coord.y)
        }
      })
      ctx.closePath()
      ctx.fill()

      // Draw arena boundary
      ctx.strokeStyle = '#FFD700'
      ctx.lineWidth = 4
      ctx.beginPath()
      arenaCoords.forEach((coord, index) => {
        if (index === 0) {
          ctx.moveTo(coord.x, coord.y)
        } else {
          ctx.lineTo(coord.x, coord.y)
        }
      })
      ctx.closePath()
      ctx.stroke()

      // Draw corner labels
      ctx.fillStyle = '#FFD700'
      ctx.font = '12px Arial'
      ctx.textAlign = 'center'
      arenaCoords.forEach((coord, index) => {
        ctx.fillText(`Corner${index + 1}`, coord.x, coord.y - 10)
        
        // Draw corner dots
        ctx.beginPath()
        ctx.arc(coord.x, coord.y, 6, 0, 2 * Math.PI)
        ctx.fill()
      })

      // Draw safe spots with pulsing animation
      safeSpotCoords.forEach((coord, index) => {
        const pulse = 1 + 0.3 * Math.sin(animationTime * 2 + index)
        const radius = 12 * pulse
        
        // Outer glow
        const glowRadius = radius * 1.5
        const gradient = ctx.createRadialGradient(coord.x, coord.y, 0, coord.x, coord.y, glowRadius)
        gradient.addColorStop(0, 'rgba(0, 255, 0, 0.8)')
        gradient.addColorStop(0.5, 'rgba(0, 255, 0, 0.4)')
        gradient.addColorStop(1, 'rgba(0, 255, 0, 0)')
        
        ctx.fillStyle = gradient
        ctx.beginPath()
        ctx.arc(coord.x, coord.y, glowRadius, 0, 2 * Math.PI)
        ctx.fill()
        
        // Main spot
        ctx.fillStyle = '#00FF00'
        ctx.beginPath()
        ctx.arc(coord.x, coord.y, radius, 0, 2 * Math.PI)
        ctx.fill()
        
        // Inner highlight
        ctx.fillStyle = '#88FF88'
        ctx.beginPath()
        ctx.arc(coord.x, coord.y, radius * 0.6, 0, 2 * Math.PI)
        ctx.fill()
        
        // Label
        ctx.fillStyle = '#FFFFFF'
        ctx.font = 'bold 14px Arial'
        ctx.textAlign = 'center'
        ctx.fillText(data.safeSpots[index].id, coord.x, coord.y + radius + 20)
        
        // Coordinates
        ctx.fillStyle = '#CCCCCC'
        ctx.font = '10px monospace'
        const coordText = `${data.safeSpots[index].lat.toFixed(4)}, ${data.safeSpots[index].lng.toFixed(4)}`
        ctx.fillText(coordText, coord.x, coord.y + radius + 35)
      })
    }

    // Draw title and info
    ctx.fillStyle = '#FFFFFF'
    ctx.font = 'bold 20px Arial'
    ctx.textAlign = 'left'
    ctx.fillText('Drone Arena - 2D View', 20, 30)
    
    ctx.font = '12px Arial'
    ctx.fillStyle = '#CCCCCC'
    ctx.fillText(`Arena Corners: ${data.arena.length} | Safe Spots: ${data.safeSpots.length}`, 20, 50)
    ctx.fillText(`Last Update: ${new Date(data.timestamp).toLocaleTimeString()}`, 20, 70)

  }, [data, gpsToCanvas, animationTime])

  // Handle canvas resize
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const updateCanvasSize = () => {
      const container = canvas.parentElement
      if (container) {
        canvas.width = container.clientWidth
        canvas.height = container.clientHeight
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>2D Arena View (Canvas)</CardTitle>
        <div className="text-sm text-muted-foreground">
          Fallback 2D visualization • Safe spots pulse with animated glow
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="w-full h-[400px] bg-gray-900 rounded-b-lg relative">
          <canvas
            ref={canvasRef}
            className="w-full h-full"
            style={{ display: 'block' }}
          />
          {(!data || data.status === 'error') && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <div className="text-center">
                <div className="text-xl mb-2">⚠️</div>
                <div>No arena data available</div>
                <div className="text-sm text-gray-400 mt-1">
                  {data?.error || 'Waiting for data...'}
                </div>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default CanvasArenaVisualizer
