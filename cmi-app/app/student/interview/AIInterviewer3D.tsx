'use client'

import { useRef, useEffect, useMemo, Suspense } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { OrbitControls, Sphere, MeshDistortMaterial, Environment, Float, Trail, useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'

interface AIInterviewer3DProps {
  state: 'idle' | 'listening' | 'thinking' | 'speaking'
  modelPath?: string
}

// Character Model Component
function CharacterModel({ state, modelPath }: { state: AIInterviewer3DProps['state'], modelPath: string }) {
  const group = useRef<THREE.Group>(null)
  
  const { scene, animations } = useGLTF(modelPath)
  const { actions } = useAnimations(animations, group)

  console.log('🎭 Loading model:', modelPath)
  console.log('📦 Scene loaded:', scene)
  console.log('🎬 Animations:', animations.length)

  // Apply holographic effect and hide ALL platform elements
  useEffect(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child instanceof THREE.Mesh) {
          // More aggressive platform detection and hiding
          const isBasePlatform = 
            child.position.y < 0 || // Hide anything below robot level
            child.name.toLowerCase().includes('base') ||
            child.name.toLowerCase().includes('platform') ||
            child.name.toLowerCase().includes('ground') ||
            child.name.toLowerCase().includes('floor') ||
            child.name.toLowerCase().includes('stand') ||
            (child.geometry instanceof THREE.BoxGeometry) ||
            (child.geometry instanceof THREE.CylinderGeometry && child.scale.x > 1) ||
            (child.geometry instanceof THREE.PlaneGeometry) ||
            (child.scale.x > 3 || child.scale.z > 3); // Hide large flat objects
          
          if (isBasePlatform) {
            child.visible = false; // Completely hide platform elements
          } else {
            // Create holographic material with orange/yellow theme
            child.material = new THREE.MeshPhysicalMaterial({
              color: new THREE.Color('#ffa500'),
              metalness: 0.8,
              roughness: 0.15,
              clearcoat: 1.0,
              clearcoatRoughness: 0.05,
              transmission: 0.1,
              thickness: 0.3,
              emissive: state === 'listening' ? new THREE.Color('#ff6b00') : 
                       state === 'speaking' ? new THREE.Color('#ffb700') :
                       state === 'thinking' ? new THREE.Color('#ffd700') :
                       new THREE.Color('#ff8c00'),
              emissiveIntensity: 0.4,
            })
            
            child.castShadow = true
            child.receiveShadow = true
          }
        }
      })
    }
  }, [scene, state])

  // Handle animations
  useEffect(() => {
    if (actions) {
      const actionNames = Object.keys(actions)
      console.log('🎭 Available animations:', actionNames)
      
      // Stop all animations first
      Object.values(actions).forEach(action => action?.stop())
      
      // Try to find state-specific animations
      let targetAnimation = null
      
      switch (state) {
        case 'idle':
          targetAnimation = actionNames.find(name => 
            name.toLowerCase().includes('idle') || 
            name.toLowerCase().includes('stand') ||
            name.toLowerCase().includes('breathing')
          )
          break
        case 'listening':
          targetAnimation = actionNames.find(name => 
            name.toLowerCase().includes('listen') || 
            name.toLowerCase().includes('attention') ||
            name.toLowerCase().includes('idle')
          )
          break
        case 'thinking':
          targetAnimation = actionNames.find(name => 
            name.toLowerCase().includes('think') || 
            name.toLowerCase().includes('ponder') ||
            name.toLowerCase().includes('idle')
          )
          break
        case 'speaking':
          targetAnimation = actionNames.find(name => 
            name.toLowerCase().includes('talk') || 
            name.toLowerCase().includes('speak') ||
            name.toLowerCase().includes('gesture') ||
            name.toLowerCase().includes('wave')
          )
          break
      }
      
      // Play the found animation or fallback to first available
      const animationToPlay = targetAnimation || actionNames[0]
      if (animationToPlay && actions[animationToPlay]) {
        actions[animationToPlay].play()
        console.log(`▶️ Playing ${state} animation:`, animationToPlay)
      }
    }
  }, [actions, state])

  // Animation loop
  useFrame((frameState) => {
    if (group.current) {
      // Gentle floating - positioned to show full robot body without cutoff
      group.current.position.y = Math.sin(frameState.clock.elapsedTime * 0.6) * 0.05 - 1.95
      
      // More dynamic rotation based on state - robots can be more mechanical
      if (state === 'speaking') {
        group.current.rotation.y = frameState.clock.elapsedTime * 0.2
      } else if (state === 'thinking') {
        group.current.rotation.y = Math.sin(frameState.clock.elapsedTime * 0.8) * 0.3
      } else {
        group.current.rotation.y = frameState.clock.elapsedTime * 0.08
      }
    }
  })

  return (
    <group ref={group} scale={[2.8, 2.8, 2.8]} position={[0, -2, 0]}>
      <primitive object={scene} />
      
      {/* Orange glow light */}
      <pointLight
        position={[0, 0.5, 0]}
        color={state === 'listening' ? '#ff6b00' : 
               state === 'speaking' ? '#ffb700' :
               state === 'thinking' ? '#ffd700' :
               '#ff8c00'}
        intensity={4}
        distance={25}
      />
      
      {/* Additional warm accent light */}
      <pointLight
        position={[2, 2, 2]}
        color="#ffa500"
        intensity={1}
        distance={15}
      />
    </group>
  )
}

function SphereAvatar({ state }: { state: AIInterviewer3DProps['state'] }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const ringRef = useRef<THREE.Mesh>(null)
  const particlesRef = useRef<THREE.Points>(null)

  // Animate based on state
  useFrame((frameState) => {
    if (meshRef.current) {
      // Gentle floating animation
      meshRef.current.position.y = Math.sin(frameState.clock.elapsedTime * 0.5) * 0.1

      // Rotation based on AI state
      if (state === 'speaking') {
        meshRef.current.rotation.y += 0.01
      } else if (state === 'thinking') {
        meshRef.current.rotation.y += 0.02
      } else {
        meshRef.current.rotation.y += 0.003
      }
    }

    // Animate ring
    if (ringRef.current) {
      ringRef.current.rotation.z += 0.01
      
      // Pulse effect based on state
      const scale = state === 'listening' ? 1.2 + Math.sin(frameState.clock.elapsedTime * 3) * 0.1 :
                   state === 'speaking' ? 1.3 + Math.sin(frameState.clock.elapsedTime * 5) * 0.15 :
                   state === 'thinking' ? 1.1 + Math.sin(frameState.clock.elapsedTime * 2) * 0.05 :
                   1.0
      
      ringRef.current.scale.set(scale, scale, 1)
    }

    // Animate particles
    if (particlesRef.current) {
      particlesRef.current.rotation.y += 0.001
      particlesRef.current.rotation.x += 0.0005
    }
  })

  // Create particle geometry
  const particleCount = 1000
  const positions = new Float32Array(particleCount * 3)
  
  for (let i = 0; i < particleCount; i++) {
    const theta = Math.random() * Math.PI * 2
    const phi = Math.random() * Math.PI
    const radius = 2 + Math.random() * 2
    
    positions[i * 3] = radius * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta)
    positions[i * 3 + 2] = radius * Math.cos(phi)
  }

  return (
    <>
      {/* Ambient particles */}
      <points ref={particlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
            args={[positions, 3]}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.02}
          color="#888888"
          transparent
          opacity={0.3}
          sizeAttenuation
        />
      </points>

      {/* Main AI sphere */}
      <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
        <mesh ref={meshRef} position={[0, 0, 0]}>
          <Sphere args={[1, 64, 64]}>
            <MeshDistortMaterial
              color={state === 'listening' ? '#ff6b6b' : 
                     state === 'speaking' ? '#4ecdc4' :
                     state === 'thinking' ? '#ffe66d' :
                     '#a8dadc'}
              attach="material"
              distort={state === 'speaking' ? 0.4 : 0.2}
              speed={state === 'speaking' ? 3 : 1}
              roughness={0.2}
              metalness={0.8}
              emissive={state === 'listening' ? '#ff6b6b' : 
                       state === 'speaking' ? '#4ecdc4' :
                       state === 'thinking' ? '#ffe66d' :
                       '#a8dadc'}
              emissiveIntensity={0.2}
            />
          </Sphere>
        </mesh>
      </Float>

      {/* Glowing ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.5, 0.05, 16, 100]} />
        <meshStandardMaterial
          color={state === 'listening' ? '#ff6b6b' : 
                 state === 'speaking' ? '#4ecdc4' :
                 state === 'thinking' ? '#ffe66d' :
                 '#ffffff'}
          emissive={state === 'listening' ? '#ff6b6b' : 
                   state === 'speaking' ? '#4ecdc4' :
                   state === 'thinking' ? '#ffe66d' :
                   '#ffffff'}
          emissiveIntensity={0.5}
          transparent
          opacity={0.8}
        />
      </mesh>

      {/* Inner core */}
      <mesh>
        <Sphere args={[0.3, 32, 32]}>
          <meshStandardMaterial
            color="#ffffff"
            emissive="#ffffff"
            emissiveIntensity={state === 'speaking' ? 1 : 0.5}
            roughness={0}
            metalness={1}
          />
        </Sphere>
      </mesh>
    </>
  )
}

function AIAvatar({ state, modelPath }: { state: AIInterviewer3DProps['state'], modelPath?: string }) {
  console.log('🤖 AIAvatar props:', { state, modelPath })
  
  if (modelPath) {
    return (
      <Suspense fallback={<SphereAvatar state={state} />}>
        <CharacterModel state={state} modelPath={modelPath} />
      </Suspense>
    )
  }
  
  return <SphereAvatar state={state} />
}

export default function AIInterviewer3D({ state, modelPath }: AIInterviewer3DProps) {
  return (
    <div className="w-full h-full">
      <Canvas
        camera={{ position: [0, 0, 10], fov: 55 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <ambientLight intensity={0.6} color="#fff5e6" />
        <pointLight position={[10, 10, 10]} intensity={1} color="#ffa500" />
        <pointLight position={[-10, -10, -10]} intensity={0.5} color="#ff8c00" />
        
        <AIAvatar state={state} modelPath={modelPath} />
        
        <OrbitControls
          enableZoom={false}
          enablePan={false}
          minPolarAngle={Math.PI / 3}
          maxPolarAngle={Math.PI / 1.5}
        />
        
        <Environment preset="city" />
      </Canvas>
    </div>
  )
} 