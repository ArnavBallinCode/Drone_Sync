"use client"

import { useEffect, useRef, useState } from "react"
import { Card } from "@/components/ui/card"

interface Position {
  latitude: number
  longitude: number
  altitude: number
}

export function PositionMap() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [positions, setPositions] = useState<Position[]>([])

  // Fetch real-time GPS data from the backend
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/params/GLOBAL_POSITION_INT.json?t=${Date.now()}`)
        if (res.ok) {
          const data = await res.json()
          // Convert MAVLink int32 lat/lon (1E7) to degrees
          const latitude = data.lat / 1e7
          const longitude = data.lon / 1e7
          const altitude = data.relative_alt ? data.relative_alt / 1000 : 0 // mm to m
          if (typeof latitude === "number" && typeof longitude === "number") {
            setPositions((prev) => [...prev.slice(-100), { latitude, longitude, altitude }])
          }
        }
      } catch {}
    }, 500)
    return () => clearInterval(interval)
  }, [])

  // Draw the map and trajectory
  useEffect(() => {
    if (!canvasRef.current || positions.length === 0) return

    const canvas = canvasRef.current
    const ctx = canvas.getContext("2d")
    if (!ctx) return
    const { width, height } = canvas

    // Clear canvas
    ctx.clearRect(0, 0, width, height)

    // Draw grid
    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 0.5

    const gridSize = 50
    for (let x = 0; x < width; x += gridSize) {
      ctx.beginPath()
      ctx.moveTo(x, 0)
      ctx.lineTo(x, height)
      ctx.stroke()
    }

    for (let y = 0; y < height; y += gridSize) {
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }

    // Calculate bounds for scaling
    if (positions.length < 2) return

    const minLat = Math.min(...positions.map((p) => p.latitude))
    const maxLat = Math.max(...positions.map((p) => p.latitude))
    const minLon = Math.min(...positions.map((p) => p.longitude))
    const maxLon = Math.max(...positions.map((p) => p.longitude))

    const latRange = maxLat - minLat || 0.001
    const lonRange = maxLon - minLon || 0.001

    // Draw trajectory
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.beginPath()

    positions.forEach((pos, i) => {
      const x = ((pos.longitude - minLon) / lonRange) * (width - 40) + 20
      const y = height - ((pos.latitude - minLat) / latRange) * (height - 40) - 20

      if (i === 0) {
        ctx.moveTo(x, y)
      } else {
        ctx.lineTo(x, y)
      }
    })

    ctx.stroke()

    // Draw current position
    const currentPos = positions[positions.length - 1]
    const x = ((currentPos.longitude - minLon) / lonRange) * (width - 40) + 20
    const y = height - ((currentPos.latitude - minLat) / latRange) * (height - 40) - 20

    // Draw direction indicator if we have at least 2 positions
    if (positions.length > 1) {
      const prevPos = positions[positions.length - 2]
      const prevX = ((prevPos.longitude - minLon) / lonRange) * (width - 40) + 20
      const prevY = height - ((prevPos.latitude - minLat) / latRange) * (height - 40) - 20

      const angle = Math.atan2(y - prevY, x - prevX)

      ctx.beginPath()
      ctx.moveTo(x, y)
      ctx.lineTo(x + Math.cos(angle) * 15, y + Math.sin(angle) * 15)
      ctx.strokeStyle = "#ef4444"
      ctx.lineWidth = 2
      ctx.stroke()
    }

    ctx.fillStyle = "#ef4444"
    ctx.beginPath()
    ctx.arc(x, y, 5, 0, Math.PI * 2)
    ctx.fill()

    // Add altitude indicator
    ctx.font = "12px Arial"
    ctx.fillStyle = "#ffffff"
    ctx.fillText(`Alt: ${currentPos.altitude.toFixed(2)}m`, x + 10, y - 10)
  }, [positions])

  return (
    <Card className="p-0 overflow-hidden">
      <canvas ref={canvasRef} width={800} height={500} className="w-full h-[500px] bg-card" />
    </Card>
  )
}

