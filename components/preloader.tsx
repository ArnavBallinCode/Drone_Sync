"use client"

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Canvas } from "@react-three/fiber"
import { useFrame } from "@react-three/fiber"
import * as THREE from "three"

function AnimatedDrone() {
  const groupRef = useRef<THREE.Group>(null)
  const propellerRefs = useRef<THREE.Group[]>([])
  
  useFrame((state) => {
    if (!groupRef.current) return
    
    // Rotate the drone in a more dynamic pattern
    const time = state.clock.getElapsedTime()
    const radius = 3 // Increased radius
    
    // Calculate position on a more complex path
    const x = Math.sin(time * 0.5) * radius * 1.5
    const y = Math.cos(time * 0.3) * radius * 0.5 + Math.sin(time * 0.7) * radius * 0.3
    const z = Math.sin(time * 0.4) * radius - 2 // Offset to bring drone closer to camera
    
    groupRef.current.position.set(x, y + 1, z)
    
    // More dramatic tilting based on movement
    const tiltAngle = Math.sin(time * 0.5) * 0.3
    const bankAngle = Math.cos(time * 0.5) * 0.4
    groupRef.current.rotation.z = tiltAngle
    groupRef.current.rotation.x = bankAngle
    groupRef.current.rotation.y = Math.sin(time * 0.3) * 0.5

    // Faster propeller rotation
    propellerRefs.current.forEach((propeller, index) => {
      if (propeller) {
        propeller.rotation.y = (time + index) * 25
      }
    })
  })

  return (
    <group ref={groupRef} scale={1.5}> {/* Increased scale */}
      {/* Main body (center hub) */}
      <mesh>
        <boxGeometry args={[0.8, 0.2, 0.8]} /> {/* Larger body */}
        <meshPhongMaterial color="#2c3e50" />
      </mesh>

      {/* Arms and propellers */}
      {[
        { pos: [-0.56, 0, 0.56], color: "#e74c3c" }, // Front left (red)
        { pos: [0.56, 0, 0.56], color: "#e74c3c" },  // Front right (red)
        { pos: [-0.56, 0, -0.56], color: "#2ecc71" }, // Back left (green)
        { pos: [0.56, 0, -0.56], color: "#2ecc71" }   // Back right (green)
      ].map((arm, i) => (
        <group key={i} position={[arm.pos[0], arm.pos[1], arm.pos[2]]}>
          {/* Arm */}
          <mesh>
            <boxGeometry args={[0.44, 0.08, 0.08]} /> {/* Larger arms */}
            <meshPhongMaterial color="#7f8c8d" />
          </mesh>

          {/* Propeller */}
          <group 
            position={[0, 0.1, 0]} 
            ref={el => {
              if (el) propellerRefs.current[i] = el
            }}
          >
            <mesh>
              <boxGeometry args={[0.5, 0.02, 0.05]} /> {/* Larger propellers */}
              <meshPhongMaterial color={arm.color} />
            </mesh>
            <mesh rotation={[0, Math.PI / 2, 0]}>
              <boxGeometry args={[0.5, 0.02, 0.05]} />
              <meshPhongMaterial color={arm.color} />
            </mesh>
          </group>

          {/* Brighter LED */}
          <pointLight position={[0, 0.1, 0]} color={arm.color} intensity={1} distance={2} />
        </group>
      ))}

      {/* Add glow effect */}
      <pointLight position={[0, 0, 0]} color="#3498db" intensity={0.5} distance={3} />
    </group>
  )
}

export function Preloader() {
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2500)
    return () => clearTimeout(timer)
  }, [])

  return (
    <AnimatePresence>
      {isLoading && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-r from-blue-900 to-black overflow-hidden"
        >
          {/* Full screen canvas for drone */}
          <div className="absolute inset-0">
            <Canvas camera={{ position: [0, 2, 8], fov: 60 }}>
              <ambientLight intensity={0.3} />
              <pointLight position={[10, 10, 10]} intensity={0.8} />
              <AnimatedDrone />
              {/* Add atmospheric fog */}
              <fog attach="fog" args={['#0a192f', 5, 15]} />
            </Canvas>
          </div>

          {/* Overlay text */}
          <div className="relative z-10 text-center">
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="mb-8"
            >
              <h1 className="text-7xl font-bold text-white mb-4 text-shadow-lg">
                Drone <span className="text-blue-400">SYNC GCS </span>
              </h1>
              <div className="h-1 w-64 mx-auto bg-blue-400 rounded-full shadow-glow" />
            </motion.div>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-4 text-blue-200 text-xl"
            >
              Initializing Drone Interface...
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}