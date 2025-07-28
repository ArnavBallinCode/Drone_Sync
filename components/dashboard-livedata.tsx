"use client"

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { RefreshCw, Wifi, WifiOff, MapPin, Clock } from "lucide-react"

// --- Types ---

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

// --- Live Monitoring Component ---

export default function LiveMonitoringPanel() {
  const [currentPosition, setCurrentPosition] = useState({ x: 0, y: 0 })
  const [connectionStatus, setConnectionStatus] = useState('Connecting...')
  const [jetsonData, setJetsonData] = useState<JetsonData | null>(null)
  const [jetsonStatus, setJetsonStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [lastJetsonUpdate, setLastJetsonUpdate] = useState<string>('')
  const [loading, setLoading] = useState(false)
  const [detectedSpots, setDetectedSpots] = useState<string[]>([])

  const DETECTION_THRESHOLD = 0.5

  // Calculate distance between two points
  const calculateDistance = (pos1: { x: number, y: number }, pos2: { x: number, y: number }) =>
    Math.sqrt(Math.pow(pos1.x - pos2.x, 2) + Math.pow(pos1.y - pos2.y, 2))

  // Convert  coordinates to local field coordinates
  const coordsToFieldCoords = (coords: { lat: number, lng: number }, arena: ArenaCorner[]): { x: number, y: number } => {
    if (arena.length < 4) {
      return {
        x: Math.max(0, Math.min(9, (coords.lat - 12.03) * 1000)),
        y: Math.max(0, Math.min(12, (coords.lng - 77.12) * 1000))
      }
    }
    const minLat = Math.min(...arena.map(c => c.lat))
    const maxLat = Math.max(...arena.map(c => c.lat))
    const minLng = Math.min(...arena.map(c => c.lng))
    const maxLng = Math.max(...arena.map(c => c.lng))
    const normalizedX = (coords.lng - minLng) / (maxLng - minLng)
    const normalizedY = (coords.lat - minLat) / (maxLat - minLat)
    return {
      x: Math.max(0, Math.min(9, normalizedX * 9)),
      y: Math.max(0, Math.min(12, normalizedY * 12))
    }
  }

  // Fetch Jetson data
  const fetchJetsonData = async (useMockData = false) => {
    setLoading(true)
    try {
      const endpoint = '/api/jetson-data'
      const method = useMockData ? 'POST' : 'GET'
      const response = await fetch(endpoint, { method, cache: 'no-store', headers: { 'Cache-Control': 'no-cache' } })
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`)
      const newData: JetsonData = await response.json()
      setJetsonData(newData)
      setLastJetsonUpdate(new Date().toLocaleTimeString())
      setJetsonStatus(newData.status === 'success' ? 'connected' : 'error')
    } catch {
      setJetsonStatus('error')
    } finally {
      setLoading(false)
    }
  }

  // Fetch current position (real data only)
  useEffect(() => {
    const fetchPositionData = async () => {
      try {
        // Try to fetch real position data
        const response = await fetch('/api/position-data', { cache: 'no-store' })
        if (response.ok) {
          const data = await response.json()
          if (data.status === 'success' && data.position) {
            setCurrentPosition(data.position)
            setConnectionStatus('Real Data')
            return
          }
        }

        // If no real data available, set to origin
        setCurrentPosition({ x: 0, y: 0 })
        setConnectionStatus('No Data')
      } catch {
        // If fetch fails, set to origin
        setCurrentPosition({ x: 0, y: 0 })
        setConnectionStatus('No Data')
      }
    }
    fetchPositionData()
    const intervalId = setInterval(fetchPositionData, 250)
    return () => clearInterval(intervalId)
  }, [])

  // Jetson data auto-refresh
  useEffect(() => {
    fetchJetsonData(true)
    const interval = setInterval(() => fetchJetsonData(), 30000)
    return () => clearInterval(interval)
  }, [])

  // Detect safe spots
  useEffect(() => {
    if (!jetsonData?.safeSpots) return
    jetsonData.safeSpots.forEach(spot => {
      const spotFieldCoords = coordsToFieldCoords(spot, jetsonData.arena)
      const distance = calculateDistance(currentPosition, spotFieldCoords)
      if (distance <= DETECTION_THRESHOLD && !detectedSpots.includes(spot.id)) {
        setDetectedSpots(prev => [...prev, spot.id])
      }
    })
  }, [currentPosition, jetsonData, detectedSpots])

  return (
    <div className="h-full flex flex-col">
      <Card className="h-full flex flex-col">
        <CardHeader className="py-2 px-3 flex-shrink-0">
          <CardTitle className="text-lg font-semibold">Live Monitoring</CardTitle>
        </CardHeader>
        <CardContent className="p-3 flex-1 flex flex-col space-y-6">
          {/* Jetson Data Info */}
          {jetsonData && (
            <div>
              <h3 className="text-base font-semibold mb-2 flex items-center gap-2">
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


        </CardContent>
      </Card>
    </div>
  )
}
