"use client"

import { Canvas, useFrame } from "@react-three/fiber"
import {
  OrbitControls,
  Grid,
  Environment,
  Trail,
  Text,
  Stats,
  PerspectiveCamera,
} from "@react-three/drei"
import { Suspense, useRef, useEffect, useState } from "react"
import { Vector3, Color, Group, Mesh, Object3D, PerspectiveCamera as ThreePerspectiveCamera, Euler } from "three"

interface Position {
  x: number
  y: number
  z: number
}

interface Attitude {
  roll: number
  pitch: number
  yaw: number
}

interface DroneProps {
  position: [number, number, number]
  rotation: [number, number, number]
  showTrail?: boolean
}

// Drone model with effects
function Drone({ position, rotation, showTrail = true }: DroneProps) {
  const droneRef = useRef<Group>(null)
  const trailRef = useRef<any>(null)
  const [engineGlow] = useState(() => new Color("#00ffff"))

  useFrame((state, delta) => {
    if (droneRef.current) {
      // Add subtle hover animation
      const currentPos = droneRef.current.position.y
      droneRef.current.position.y = currentPos + Math.sin(state.clock.elapsedTime * 2) * 0.002
      
      // Update rotation with proper order (YXZ for aircraft-like rotation)
      droneRef.current.rotation.order = 'YXZ'
      droneRef.current.rotation.set(
        -rotation[0], // pitch (around X)
        -rotation[1], // yaw (around Y)
        -rotation[2], // roll (around Z)
      )
      
      // Add propeller rotation effect
      droneRef.current.children.forEach((child: Object3D) => {
        if (child instanceof Mesh && child.name.includes("propeller")) {
          child.rotation.y += delta * (child.name.includes("-0") ? 15 : -15)
        }
      })
    }
  })

  return (
    <group position={position}>
      {showTrail && (
        <Trail
          ref={trailRef}
          width={0.5}
          length={8}
          color={new Color(0x88ccff)}
          attenuation={(t) => t * t}
        >
          <mesh visible={false}>
            <boxGeometry args={[0.1, 0.1, 0.1]} />
          </mesh>
        </Trail>
      )}
      
      <group ref={droneRef}>
        {/* Main body - center hub */}
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.4, 0.1, 0.4]} />
          <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
        </mesh>

        {/* Top cover with slight bevel */}
        <mesh castShadow position={[0, 0.06, 0]}>
          <boxGeometry args={[0.35, 0.04, 0.35]} />
          <meshStandardMaterial color="#34495e" metalness={0.6} roughness={0.3} />
        </mesh>

        {/* LED status light */}
        <pointLight position={[0, 0.1, 0]} color="#00ff00" intensity={0.5} distance={0.3} />
        <mesh position={[0, 0.08, 0]}>
          <sphereGeometry args={[0.02, 8, 8]} />
          <meshStandardMaterial color="#00ff00" emissive="#00ff00" emissiveIntensity={0.5} />
        </mesh>

        {/* Arms and propellers */}
        {[
          { pos: [-0.28, 0, 0.28] as [number, number, number], color: "#e74c3c", rotation: Math.PI / 4 },
          { pos: [0.28, 0, 0.28] as [number, number, number], color: "#e74c3c", rotation: -Math.PI / 4 },
          { pos: [-0.28, 0, -0.28] as [number, number, number], color: "#2ecc71", rotation: -Math.PI / 4 },
          { pos: [0.28, 0, -0.28] as [number, number, number], color: "#2ecc71", rotation: Math.PI / 4 }
        ].map((arm, i) => (
          <group key={i} position={arm.pos} rotation={[0, arm.rotation, 0]}>
            {/* Arm */}
            <mesh castShadow receiveShadow>
              <boxGeometry args={[0.22, 0.04, 0.04]} />
              <meshStandardMaterial color="#7f8c8d" metalness={0.6} roughness={0.4} />
            </mesh>

            {/* Motor housing */}
            <mesh position={[0, 0.04, 0]} castShadow>
              <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
              <meshStandardMaterial color="#2c3e50" metalness={0.8} roughness={0.2} />
            </mesh>

            {/* Propeller */}
            <mesh name={`propeller-${i}`} position={[0, 0.08, 0]} castShadow>
              <cylinderGeometry args={[0.12, 0.12, 0.01, 16]} />
              <meshStandardMaterial 
                color={arm.color} 
                transparent={true} 
                opacity={0.8} 
                metalness={0.4} 
                roughness={0.6} 
              />
            </mesh>

            {/* Engine glow */}
            <pointLight
              position={[0, 0.05, 0]}
              color={arm.color}
              intensity={1.5}
              distance={0.3}
              decay={2}
            />
          </group>
        ))}
      </group>
    </group>
  )
}

// Debug overlay
function DebugOverlay({ position, attitude }: { position: Position; attitude: Attitude }) {
  // Determine which quadrant the drone is in
  const quadrant = position.x >= 0 && position.y >= 0 ? "I (+X, +Z)" :
                   position.x < 0 && position.y >= 0 ? "II (-X, +Z)" :
                   position.x < 0 && position.y < 0 ? "III (-X, -Z)" :
                   "IV (+X, -Z)"
                   
  return (
    <group position={[-8, 3, 0]}>
      <Text
        color="white"
        fontSize={0.15}
        maxWidth={3}
        lineHeight={1.5}
        letterSpacing={0.02}
        textAlign="left"
        anchorX="left"
        anchorY="top"
      >
        {`Position (m):
X: ${position.x.toFixed(2)}
Y: ${position.y.toFixed(2)}
Z: ${position.z.toFixed(2)}

Quadrant: ${quadrant}

Attitude (deg):
Roll: ${(attitude.roll * 180 / Math.PI).toFixed(1)}°
Pitch: ${(attitude.pitch * 180 / Math.PI).toFixed(1)}°
Yaw: ${(attitude.yaw * 180 / Math.PI).toFixed(1)}°`}
      </Text>
    </group>
  )
}

// Enhanced grid with better visibility and extended range
function EnhancedGrid() {
  // Extended arena dimensions: -9 to +9 (18m wide) and -12 to +12 (24m long)
  return (
    <>
      <Grid
        position={[0, 0, 0]} // Center the grid at origin
        args={[18, 24]} // 18m x 24m total area
        cellSize={1}
        cellThickness={1.5}
        cellColor="#ffffff"
        sectionSize={3}
        sectionThickness={2}
        sectionColor="#00ff00"
        fadeDistance={50}
        fadeStrength={1}
        infiniteGrid={false}
        followCamera={false}
      />
      
      {/* X-axis labels (-9 to +9) */}
      {Array.from({length: 19}, (_, i) => i - 9).map((x) => (
        <Text
          key={`x-${x}`}
          position={[x, 0.1, -12.5]}
          rotation={[-Math.PI / 2, 0, 0]}
          color="#ffffff"
          fontSize={0.4}
        >
          {x}m
        </Text>
      ))}
      
      {/* Z-axis labels (-12 to +12) */}
      {Array.from({length: 25}, (_, i) => i - 12).map((z) => (
        <Text
          key={`z-${z}`}
          position={[-9.5, 0.1, z]}
          rotation={[-Math.PI / 2, 0, Math.PI / 2]}
          color="#ffffff"
          fontSize={0.4}
        >
          {z}m
        </Text>
      ))}
      
      {/* Quadrant boundary lines */}
      <group>
        {/* X-axis line */}
        <mesh position={[0, 0.01, 0]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 18]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
        </mesh>
        
        {/* Z-axis line */}
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 24]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={0.3} />
        </mesh>
      </group>
      
      {/* Corner markers for extended area */}
      <group>
        <mesh position={[-9, 0.05, -12]}>
          <cylinderGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[9, 0.05, -12]}>
          <cylinderGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[-9, 0.05, 12]}>
          <cylinderGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.3} />
        </mesh>
        <mesh position={[9, 0.05, 12]}>
          <cylinderGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={0.3} />
        </mesh>
        
      </group>
    </>
  )
}

// Dotted trajectory line component
function TrajectoryLine({ points }: { points: Position[] }) {
  if (points.length < 2) return null
  const positions = points.map((p) => [p.x, -p.z, p.y]) // Flip Z axis to positive up
  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(positions.flat()), 3]}
        />
      </bufferGeometry>
      <lineDashedMaterial
        attach="material"
        color="#38bdf8"
        linewidth={2}
        dashSize={0.3}
        gapSize={0.2}
      />
    </line>
  )
}

// Vertical height line
function HeightLine({ position }: { position: Position }) {
  const points = [
    [position.x, 0, position.y],
    [position.x, -position.z, position.y], // Flip Z axis
  ]
  return (
    <line>
      <bufferGeometry attach="geometry">
        <bufferAttribute
          attach="attributes-position"
          args={[new Float32Array(points.flat()), 3]}
        />
      </bufferGeometry>
      <lineDashedMaterial
        attach="material"
        color="#f43f5e"
        linewidth={2}
        dashSize={0.15}
        gapSize={0.15}
      />
    </line>
  )
}

// Environment effects with custom ground size
function Environment3D() {
  // 30x40 feet ≈ 9.14m x 12.19m
  return (
    <>
      {/* Main lighting */}
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1} 
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-5, 5, -5]} intensity={0.5} />
      {/* Removed navy blue ground plane */}
      {/* Environment effects */}
      <Environment preset="sunset" />
    </>
  )
}

interface EnhancedVisualizerProps {
  className?: string
}

export function Enhanced3DView({ className }: EnhancedVisualizerProps) {
  const [position, setPosition] = useState<Position>({ x: 0, y: 0, z: -1.5 })
  const [attitude, setAttitude] = useState<Attitude>({ roll: 0, pitch: 0, yaw: 0 })
  const [trajectory, setTrajectory] = useState<Position[]>([])
  const cameraRef = useRef<ThreePerspectiveCamera>(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch position data
        const posRes = await fetch(`/params/LOCAL_POSITION_NED.json?t=${Date.now()}`)
        if (posRes.ok) {
          const posData = await posRes.json()
          setPosition(posData)
          setTrajectory((prev) => [...prev.slice(-199), posData]) // Keep last 200 points
        }

        // Fetch attitude data
        const attRes = await fetch(`/params/ATTITUDE.json?t=${Date.now()}`)
        if (attRes.ok) {
          const attData = await attRes.json()
          setAttitude(attData)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
      }
    }

    fetchData()
    const interval = setInterval(fetchData, 100) // Update at 10Hz
    return () => clearInterval(interval)
  }, [])

  return (
    <div style={{ position: 'relative', width: '100%', height: '600px' }} className={`rounded-2xl overflow-hidden border bg-black ${className}`}>
      <Canvas shadows>
        <Suspense fallback={null}>
          <PerspectiveCamera
            makeDefault
            position={[12, 8, 12]}
            fov={60}
            near={0.1}
            far={1000}
            ref={cameraRef}
          />
          <Environment3D />
          <EnhancedGrid />
          <TrajectoryLine points={trajectory} />
          <HeightLine position={position} />
          <Drone
            position={[position.x, -position.z, position.y]} // Flip Z axis to positive up
            rotation={[-attitude.pitch, -attitude.yaw, -attitude.roll]}
          />
          <DebugOverlay position={{ ...position, z: -position.z }} attitude={attitude} />
          <OrbitControls
            minDistance={1}
            maxDistance={50}
            enableDamping
            dampingFactor={0.05}
            target={[position.x, -position.z, position.y]}
            maxPolarAngle={Math.PI / 1.5}
            minPolarAngle={0}
          />
        </Suspense>
      </Canvas>
      <div style={{ 
        position: 'absolute', 
        bottom: '8px', 
        right: '8px',
        zIndex: 1000
      }}>
        <Stats 
          showPanel={0}
          className="stats-panel" 
        />
      </div>
    </div>
  )
}