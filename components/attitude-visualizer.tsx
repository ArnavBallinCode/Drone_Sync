"use client"

import { useRef, useState, useEffect } from "react"
import { Canvas, useFrame } from "@react-three/fiber"
import { OrbitControls, Grid, Stats } from "@react-three/drei"
import * as THREE from "three"

// Attitude simulator for realistic attitude visualization
class AttitudeSimulator {
  // Attitude data
  roll = 0
  pitch = 0
  yaw = 0

  // Flight pattern parameters
  angle = 0
  angleIncrement = 0.02 // Slower for smoother visualization

  // Update attitude with realistic changes
  update() {
    // Update the angle for a circular/figure-8 pattern
    this.angle += this.angleIncrement

    // Calculate target attitude based on a realistic flight pattern
    const targetRoll = Math.sin(this.angle) * 0.2 // gentle roll, max ~11 degrees
    const targetPitch = Math.sin(this.angle) * 0.5 // increased pitch for visibility, max ~30 degrees
    const targetYaw = this.angle % (2 * Math.PI) // continuous yaw rotation

    // Smoothly move toward the target attitude
    this.roll = this.roll * 0.95 + targetRoll * 0.05
    this.pitch = this.pitch * 0.95 + targetPitch * 0.05

    // Calculate yaw change with proper handling of the 2π boundary
    let yawDiff = targetYaw - this.yaw
    if (yawDiff > Math.PI) yawDiff -= 2 * Math.PI
    if (yawDiff < -Math.PI) yawDiff += 2 * Math.PI

    this.yaw += yawDiff * 0.05

    // Keep yaw in range [0, 2π]
    if (this.yaw > 2 * Math.PI) this.yaw -= 2 * Math.PI
    if (this.yaw < 0) this.yaw += 2 * Math.PI

    return {
      roll: this.roll,
      pitch: this.pitch,
      yaw: this.yaw,
    }
  }
}

// Drone model component
function DroneModel({ attitude }: { attitude: { roll: number; pitch: number; yaw: number } }) {
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    if (!groupRef.current) return
    
    // Reset rotation
    groupRef.current.rotation.set(0, 0, 0)
    
    // Apply rotations in the correct order: yaw, pitch, roll
    groupRef.current.rotateY(attitude.yaw)
    groupRef.current.rotateX(attitude.pitch)
    groupRef.current.rotateZ(attitude.roll)
  }, [attitude])

  return (
    <group ref={groupRef}>
      {/* Main body (center hub) */}
      <mesh>
        <boxGeometry args={[0.4, 0.1, 0.4]} />
        <meshPhongMaterial color="#2c3e50" flatShading />
      </mesh>

      {/* Top cover */}
      <mesh position={[0, 0.075, 0]}>
        <boxGeometry args={[0.35, 0.05, 0.35]} />
        <meshPhongMaterial color="#34495e" flatShading />
      </mesh>

      {/* Arms and propellers */}
      {[
        { pos: [-0.28, 0, 0.28], color: "#e74c3c" }, // Front left (red)
        { pos: [0.28, 0, 0.28], color: "#e74c3c" },  // Front right (red)
        { pos: [-0.28, 0, -0.28], color: "#2ecc71" }, // Back left (green)
        { pos: [0.28, 0, -0.28], color: "#2ecc71" }   // Back right (green)
      ].map((arm, i) => (
        <group key={i} position={[arm.pos[0], arm.pos[1], arm.pos[2]]} rotation={[0, Math.atan2(arm.pos[2], arm.pos[0]), 0]}>
          {/* Arm */}
          <mesh>
            <boxGeometry args={[0.22, 0.04, 0.04]} />
            <meshPhongMaterial color="#7f8c8d" />
          </mesh>

          {/* Motor housing */}
          <mesh position={[0, 0.05, 0]}>
            <cylinderGeometry args={[0.04, 0.04, 0.06, 12]} />
            <meshPhongMaterial color="#2c3e50" />
          </mesh>

          {/* Propeller blades */}
          <group position={[0, 0.08, 0]}>
            <mesh>
              <boxGeometry args={[0.25, 0.01, 0.025]} />
              <meshPhongMaterial color={arm.color} />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.25, 0.01, 0.025]} />
              <meshPhongMaterial color={arm.color} />
            </mesh>
          </group>

          {/* Motor light */}
          <pointLight position={[0, 0.05, 0]} color={arm.color} intensity={0.5} distance={0.3} />
        </group>
      ))}

      {/* LED indicator */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.02, 8, 8]} />
        <meshPhongMaterial color="#2ecc71" emissive="#2ecc71" />
      </mesh>
    </group>
  )
}

// Scene setup component
function Scene({ attitude }: { attitude: { roll: number; pitch: number; yaw: number } }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <Grid args={[10, 10]} cellColor="#444444" sectionColor="#222222" fadeDistance={30} />
      <DroneModel attitude={attitude} />
      <OrbitControls 
        enableDamping 
        dampingFactor={0.05} 
        minDistance={1} 
        maxDistance={10}
      />
    </>
  )
}

export function AttitudeVisualizer() {
  const [attitude, setAttitude] = useState({ roll: 0, pitch: 0, yaw: 0 })
  const simulatorRef = useRef(new AttitudeSimulator())

  useEffect(() => {
    const fetchAttitudeData = async () => {
      try {
        const response = await fetch(`/params/ATTITUDE.json?t=${Date.now()}`)
        if (!response.ok) {
          const simulatedAttitude = simulatorRef.current.update()
          setAttitude(simulatedAttitude)
          return
        }

        const data = await response.json()
        if (data && typeof data.roll === "number" && typeof data.pitch === "number" && typeof data.yaw === "number") {
          setAttitude(data)
        }
      } catch (error) {
        console.error("Error fetching attitude data:", error)
        const simulatedAttitude = simulatorRef.current.update()
        setAttitude(simulatedAttitude)
      }
    }

    fetchAttitudeData()
    const intervalId = setInterval(fetchAttitudeData, 100)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <div className="w-full h-full rounded-lg bg-black/10">
      <Canvas camera={{ position: [0, 2, 5], fov: 75 }}>
        <Scene attitude={attitude} />
      </Canvas>
    </div>
  )
}

