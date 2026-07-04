'use client';

import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { MeshDistortMaterial, Sparkles, Environment, Float } from '@react-three/drei';
import * as THREE from 'three';

interface VisualizerProps {
  isPlaying: boolean;
  frequency: number;
  type: 'sphere' | 'liquid' | 'stars';
}

function BreathingSphere({ isPlaying, color }: { isPlaying: boolean, color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (!meshRef.current || !materialRef.current) return;
    const t = state.clock.getElapsedTime();
    
    // Breathing effect
    const scale = isPlaying ? 1 + Math.sin(t * 1.5) * 0.05 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(scale, scale, scale), 0.1);
    
    // Distortion effect
    materialRef.current.distort = THREE.MathUtils.lerp(
      materialRef.current.distort,
      isPlaying ? 0.4 : 0.1,
      0.05
    );
    materialRef.current.speed = THREE.MathUtils.lerp(
      materialRef.current.speed,
      isPlaying ? 2 : 0.5,
      0.05
    );
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[2, 64, 64]} />
        <MeshDistortMaterial
          ref={materialRef}
          color={color}
          envMapIntensity={1}
          clearcoat={1}
          clearcoatRoughness={0.1}
          metalness={0.8}
          roughness={0.2}
        />
      </mesh>
    </Float>
  );
}

function LiquidCalm({ isPlaying, color }: { isPlaying: boolean, color: string }) {
  const meshRef = useRef<THREE.Mesh>(null);
  
  useFrame((state) => {
    if (!meshRef.current) return;
    const t = state.clock.getElapsedTime();
    meshRef.current.rotation.x = Math.PI / 2;
    meshRef.current.rotation.z = t * (isPlaying ? 0.2 : 0.05);
    
    const positionAttribute = meshRef.current.geometry.attributes.position;
    const vertex = new THREE.Vector3();
    for (let i = 0; i < positionAttribute.count; i++) {
      vertex.fromBufferAttribute(positionAttribute, i);
      const waveX = Math.sin(vertex.x * 2 + t) * (isPlaying ? 0.2 : 0.05);
      const waveY = Math.cos(vertex.y * 2 + t) * (isPlaying ? 0.2 : 0.05);
      vertex.z = waveX + waveY;
      positionAttribute.setXYZ(i, vertex.x, vertex.y, vertex.z);
    }
    positionAttribute.needsUpdate = true;
  });

  return (
    <mesh ref={meshRef} position={[0, -1, 0]}>
      <planeGeometry args={[15, 15, 64, 64]} />
      <meshStandardMaterial
        color={color}
        metalness={0.9}
        roughness={0.1}
        envMapIntensity={1}
        transparent
        opacity={0.8}
      />
    </mesh>
  );
}

function Stardust({ isPlaying, color }: { isPlaying: boolean, color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  
  useFrame((state) => {
    if (!groupRef.current) return;
    const t = state.clock.getElapsedTime();
    groupRef.current.rotation.y = t * (isPlaying ? 0.05 : 0.01);
    groupRef.current.rotation.x = Math.sin(t * 0.1) * 0.2;
  });

  return (
    <group ref={groupRef}>
      <Sparkles 
        count={isPlaying ? 400 : 100} 
        scale={12} 
        size={isPlaying ? 4 : 2} 
        speed={isPlaying ? 0.4 : 0.1} 
        opacity={0.6} 
        color={color} 
      />
      <Sparkles 
        count={isPlaying ? 100 : 50} 
        scale={8} 
        size={isPlaying ? 8 : 4} 
        speed={isPlaying ? 0.2 : 0.05} 
        opacity={0.4} 
        color="#ffffff" 
      />
    </group>
  );
}

export default function Visualizer3D({ isPlaying, frequency, type }: VisualizerProps) {
  const color = useMemo(() => {
    // Standard frequencies
    if (frequency === 111) return '#8b5cf6'; // Violet
    if (frequency === 396) return '#f97316'; // Orange
    if (frequency === 432) return '#10b981'; // Emerald
    if (frequency === 528) return '#eab308'; // Yellow
    
    // Custom frequency color mapping (Hue rotation based on frequency)
    // We use a log scale for frequency to color mapping to handle 0-400k range
    const hue = (Math.log10(frequency + 1) * 60) % 360;
    return `hsl(${hue}, 70%, 50%)`;
  }, [frequency]);

  // Animation speed multiplier based on frequency
  // Higher frequencies result in faster, more energetic animations
  const speedMultiplier = useMemo(() => {
    return Math.max(0.1, Math.log10(frequency + 1) * 0.5);
  }, [frequency]);

  return (
    <div className="w-full h-full absolute inset-0 pointer-events-none transition-opacity duration-1000" style={{ opacity: isPlaying ? 1 : 0.5 }}>
      <Canvas camera={{ position: [0, 0, 6], fov: 45 }}>
        <ambientLight intensity={0.2} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <Environment preset="city" />
        
        <Float speed={2 * speedMultiplier} rotationIntensity={0.5} floatIntensity={1}>
          {type === 'sphere' && <BreathingSphere isPlaying={isPlaying} color={color} />}
          {type === 'liquid' && <LiquidCalm isPlaying={isPlaying} color={color} />}
          {type === 'stars' && <Stardust isPlaying={isPlaying} color={color} />}
        </Float>
      </Canvas>
    </div>
  );
}
