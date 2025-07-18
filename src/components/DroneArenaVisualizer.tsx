"use client"

import React, { useEffect, useRef, useState, useCallback } from 'react'
import * as THREE from 'three'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import CanvasArenaVisualizer from './CanvasArenaVisualizer'

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

const DroneArenaVisualizer: React.FC = () => {
  const mountRef = useRef<HTMLDivElement>(null)
  const sceneRef = useRef<THREE.Scene | null>(null)
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null)
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null)
  const frameRef = useRef<number | null>(null)
  const safeSpotMeshesRef = useRef<THREE.Mesh[]>([])
  const arenaMeshRef = useRef<THREE.LineLoop | null>(null)
  
  const [data, setData] = useState<JetsonData | null>(null)
  const [loading, setLoading] = useState(false)
  const [lastUpdate, setLastUpdate] = useState<string>('')
  const [autoUpdate, setAutoUpdate] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'error'>('disconnected')
  const [use3D, setUse3D] = useState(true)

  // Convert GPS coordinates to local coordinates for visualization
  const gpsToLocal = useCallback((coords: ArenaCorner[]): THREE.Vector2[] => {
    if (coords.length === 0) return []
    
    // Find bounding box
    const minLat = Math.min(...coords.map(c => c.lat))
    const maxLat = Math.max(...coords.map(c => c.lat))
    const minLng = Math.min(...coords.map(c => c.lng))
    const maxLng = Math.max(...coords.map(c => c.lng))
    
    // Scale to fit in a 20x20 unit space
    const scale = 20
    
    return coords.map(coord => new THREE.Vector2(
      ((coord.lng - minLng) / (maxLng - minLng) - 0.5) * scale,
      ((coord.lat - minLat) / (maxLat - minLat) - 0.5) * scale
    ))
  }, [])

  // Initialize Three.js scene
  const initScene = useCallback(() => {
    if (!mountRef.current) return

    // Scene
    const scene = new THREE.Scene()
    scene.background = new THREE.Color(0x001122)
    sceneRef.current = scene

    // Camera
    const camera = new THREE.PerspectiveCamera(
      75,
      mountRef.current.clientWidth / mountRef.current.clientHeight,
      0.1,
      1000
    )
    camera.position.set(0, 25, 25)
    camera.lookAt(0, 0, 0)
    cameraRef.current = camera

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true })
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight)
    renderer.shadowMap.enabled = true
    renderer.shadowMap.type = THREE.PCFSoftShadowMap
    mountRef.current.appendChild(renderer.domElement)
    rendererRef.current = renderer

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6)
    scene.add(ambientLight)

    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 20, 10)
    directionalLight.castShadow = true
    directionalLight.shadow.mapSize.width = 2048
    directionalLight.shadow.mapSize.height = 2048
    scene.add(directionalLight)

    // Ground plane
    const groundGeometry = new THREE.PlaneGeometry(50, 50)
    const groundMaterial = new THREE.MeshLambertMaterial({ 
      color: 0x228B22,
      transparent: true,
      opacity: 0.8
    })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    ground.receiveShadow = true
    scene.add(ground)

    // Grid helper
    const gridHelper = new THREE.GridHelper(40, 40, 0x444444, 0x444444)
    scene.add(gridHelper)

    // Controls simulation (basic rotation)
    let angle = 0
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate)
      
      // Gentle rotation around the scene
      angle += 0.005
      if (cameraRef.current) {
        cameraRef.current.position.x = 30 * Math.cos(angle)
        cameraRef.current.position.z = 30 * Math.sin(angle)
        cameraRef.current.lookAt(0, 0, 0)
      }

      // Animate safe spots (pulsing effect)
      safeSpotMeshesRef.current.forEach((mesh, index) => {
        const time = Date.now() * 0.001
        const scale = 1 + 0.3 * Math.sin(time * 2 + index)
        mesh.scale.setScalar(scale)
      })

      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current)
      }
    }
    animate()

  }, [])

  // Update arena visualization
  const updateArenaVisualization = useCallback((arenaData: JetsonData) => {
    if (!sceneRef.current) return

    // Remove existing arena
    if (arenaMeshRef.current) {
      sceneRef.current.remove(arenaMeshRef.current)
    }

    // Remove existing safe spots
    safeSpotMeshesRef.current.forEach(mesh => {
      sceneRef.current?.remove(mesh)
    })
    safeSpotMeshesRef.current = []

    if (arenaData.arena.length >= 4) {
      // Create arena boundary
      const arenaPoints = gpsToLocal(arenaData.arena)
      const arenaGeometry = new THREE.BufferGeometry()
      const vertices = new Float32Array([
        ...arenaPoints.flatMap(p => [p.x, 0.1, p.y]),
        arenaPoints[0].x, 0.1, arenaPoints[0].y // Close the loop
      ])
      arenaGeometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3))
      
      const arenaMaterial = new THREE.LineBasicMaterial({ 
        color: 0xFFD700, 
        linewidth: 5 
      })
      const arenaLine = new THREE.LineLoop(arenaGeometry, arenaMaterial)
      sceneRef.current.add(arenaLine)
      arenaMeshRef.current = arenaLine

      // Create arena floor
      const arenaShape = new THREE.Shape()
      arenaPoints.forEach((point, index) => {
        if (index === 0) {
          arenaShape.moveTo(point.x, point.y)
        } else {
          arenaShape.lineTo(point.x, point.y)
        }
      })
      
      const arenaFloorGeometry = new THREE.ShapeGeometry(arenaShape)
      const arenaFloorMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x228B22,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide
      })
      const arenaFloor = new THREE.Mesh(arenaFloorGeometry, arenaFloorMaterial)
      arenaFloor.rotation.x = -Math.PI / 2
      arenaFloor.position.y = 0.05
      sceneRef.current.add(arenaFloor)
    }

    // Create safe spots
    if (arenaData.safeSpots.length > 0 && arenaData.arena.length >= 4) {
      const arenaWithSafeSpots = [...arenaData.arena, ...arenaData.safeSpots.map(s => ({ lat: s.lat, lng: s.lng }))]
      const allLocalCoords = gpsToLocal(arenaWithSafeSpots)
      const safeSpotCoords = allLocalCoords.slice(arenaData.arena.length)

      safeSpotCoords.forEach((coord, index) => {
        // Main safe spot cylinder
        const spotGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2, 8)
        const spotMaterial = new THREE.MeshPhongMaterial({ 
          color: 0x00FF00,
          transparent: true,
          opacity: 0.8,
          emissive: 0x002200
        })
        const spotMesh = new THREE.Mesh(spotGeometry, spotMaterial)
        spotMesh.position.set(coord.x, 1, coord.y)
        spotMesh.castShadow = true
        if (sceneRef.current) {
          sceneRef.current.add(spotMesh)
        }
        safeSpotMeshesRef.current.push(spotMesh)

        // Glow ring around safe spot
        const ringGeometry = new THREE.RingGeometry(1.2, 1.5, 16)
        const ringMaterial = new THREE.MeshBasicMaterial({ 
          color: 0x00FF00,
          transparent: true,
          opacity: 0.4,
          side: THREE.DoubleSide
        })
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial)
        ringMesh.position.set(coord.x, 0.1, coord.y)
        ringMesh.rotation.x = -Math.PI / 2
        if (sceneRef.current) {
          sceneRef.current.add(ringMesh)
        }

        // Label
        const canvas = document.createElement('canvas')
        const context = canvas.getContext('2d')!
        canvas.width = 256
        canvas.height = 64
        context.fillStyle = '#FFFFFF'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.fillStyle = '#000000'
        context.font = 'Bold 24px Arial'
        context.textAlign = 'center'
        context.fillText(arenaData.safeSpots[index].id, canvas.width / 2, 40)

        const labelTexture = new THREE.CanvasTexture(canvas)
        const labelMaterial = new THREE.SpriteMaterial({ map: labelTexture, transparent: true })
        const labelSprite = new THREE.Sprite(labelMaterial)
        labelSprite.position.set(coord.x, 3.5, coord.y)
        labelSprite.scale.set(4, 1, 1)
        sceneRef.current.add(labelSprite)
      })
    }
  }, [gpsToLocal])

  // Fetch data from API
  const fetchData = useCallback(async (useMockData = false) => {
    setLoading(true)
    try {
      const endpoint = useMockData ? '/api/jetson-data' : '/api/jetson-data'
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
      setData(newData)
      setLastUpdate(new Date().toLocaleTimeString())
      
      if (newData.status === 'success') {
        setConnectionStatus('connected')
        updateArenaVisualization(newData)
      } else {
        setConnectionStatus('error')
        console.error('Data fetch error:', newData.error)
      }
    } catch (error) {
      console.error('Error fetching arena data:', error)
      setConnectionStatus('error')
      setData(prev => prev ? { ...prev, status: 'error', error: 'Network error' } : null)
    } finally {
      setLoading(false)
    }
  }, [updateArenaVisualization])

  // Handle window resize
  const handleResize = useCallback(() => {
    if (!mountRef.current || !cameraRef.current || !rendererRef.current) return
    
    const width = mountRef.current.clientWidth
    const height = mountRef.current.clientHeight
    
    cameraRef.current.aspect = width / height
    cameraRef.current.updateProjectionMatrix()
    rendererRef.current.setSize(width, height)
  }, [])

  // Initialize scene and start data fetching
  useEffect(() => {
    initScene()
    fetchData(true) // Start with mock data
    
    window.addEventListener('resize', handleResize)
    
    return () => {
      window.removeEventListener('resize', handleResize)
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement)
        rendererRef.current.dispose()
      }
    }
  }, [initScene, fetchData, handleResize])

  // Auto-update every 30 seconds
  useEffect(() => {
    if (!autoUpdate) return

    const interval = setInterval(() => {
      fetchData()
    }, 30000) // 30 seconds

    return () => clearInterval(interval)
  }, [autoUpdate, fetchData])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">🏟️ Drone Arena Visualizer</h1>
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
            connectionStatus === 'connected' ? 'bg-green-100 text-green-800' :
            connectionStatus === 'error' ? 'bg-red-100 text-red-800' :
            'bg-yellow-100 text-yellow-800'
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              connectionStatus === 'connected' ? 'bg-green-500' :
              connectionStatus === 'error' ? 'bg-red-500' :
              'bg-yellow-500'
            }`} />
            {connectionStatus === 'connected' ? 'Connected' :
             connectionStatus === 'error' ? 'Error' : 'Connecting'}
          </div>
          <Button
            onClick={() => fetchData()}
            disabled={loading}
            size="sm"
          >
            {loading ? 'Updating...' : 'Refresh'}
          </Button>
          <Button
            onClick={() => fetchData(true)}
            variant="outline"
            size="sm"
          >
            Mock Data
          </Button>
        </div>
      </div>

      {data?.status === 'error' && (
        <Alert variant="destructive">
          <AlertTitle>Connection Error</AlertTitle>
          <AlertDescription>
            {data.error || 'Failed to connect to Jetson device'}
          </AlertDescription>
        </Alert>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* 3D Visualization */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>3D Arena View</CardTitle>
            <div className="text-sm text-muted-foreground">
              Auto-rotating view • Safe spots pulse with glow effect
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div 
              ref={mountRef} 
              className="w-full h-[500px] bg-gray-900 rounded-b-lg"
              style={{ minHeight: '500px' }}
            />
          </CardContent>
        </Card>

        {/* Control Panel */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Live Data Panel</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Status */}
            <div>
              <h3 className="text-sm font-semibold mb-2">📡 Connection Status</h3>
              <div className="text-sm font-mono bg-gray-50 p-2 rounded">
                <div>Jetson: 10.0.2.219</div>
                <div>Last Update: {lastUpdate || 'Never'}</div>
                <div>Auto-refresh: {autoUpdate ? 'ON' : 'OFF'}</div>
              </div>
            </div>

            {/* Arena Info */}
            {data && (
              <div>
                <h3 className="text-sm font-semibold mb-2">🏟️ Arena Info</h3>
                <div className="text-sm bg-gray-50 p-2 rounded space-y-1">
                  <div>Corners: {data.arena.length}</div>
                  <div>Safe Spots: {data.safeSpots.length}</div>
                  <div>Status: {data.status}</div>
                </div>
              </div>
            )}

            {/* Safe Spots List */}
            {data?.safeSpots && data.safeSpots.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">📍 Safe Spots</h3>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {data.safeSpots.map((spot, index) => (
                    <div key={spot.id} className="bg-green-50 border border-green-200 p-2 rounded text-xs">
                      <div className="font-semibold text-green-800">{spot.id}</div>
                      <div className="font-mono text-green-600">
                        {spot.lat.toFixed(6)}, {spot.lng.toFixed(6)}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Arena Coordinates */}
            {data?.arena && data.arena.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold mb-2">📐 Arena Corners</h3>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {data.arena.map((corner, index) => (
                    <div key={index} className="bg-yellow-50 border border-yellow-200 p-1 rounded text-xs">
                      <span className="font-semibold text-yellow-800">Corner{index + 1}:</span>
                      <span className="font-mono text-yellow-600 ml-1">
                        [{corner.lat.toFixed(6)}, {corner.lng.toFixed(6)}]
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Settings */}
            <div className="pt-4 border-t">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Auto-refresh (30s)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoUpdate}
                    onChange={(e) => setAutoUpdate(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Legend */}
      <Card>
        <CardHeader>
          <CardTitle>Legend & Info</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-semibold mb-2">Visualization Elements</h4>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-yellow-500"></div>
                  <span>Arena Boundary (Yellow)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded"></div>
                  <span>Safe Spots (Green, Pulsing)</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-800"></div>
                  <span>Arena Floor (Semi-transparent)</span>
                </div>
              </div>
            </div>
            <div>
              <h4 className="font-semibold mb-2">Data Source</h4>
              <div className="text-sm text-muted-foreground">
                <div>Jetson Device: jetson123@10.0.2.219</div>
                <div>File: /home/nvidia/safe_zone_data.txt</div>
                <div>Update Interval: 30 seconds</div>
                <div>Coordinate System: GPS (Lat/Lng)</div>
              </div>
            </div>
          </div>
          
          {data?.timestamp && (
            <div className="mt-4 pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                Last data timestamp: {new Date(data.timestamp).toLocaleString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

export default DroneArenaVisualizer
