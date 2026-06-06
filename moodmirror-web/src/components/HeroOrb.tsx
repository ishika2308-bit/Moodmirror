import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { Sphere, MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

interface HeroOrbProps {
  isAwake: boolean;
}

export const HeroOrb: React.FC<HeroOrbProps> = ({ isAwake }) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<any>(null);

  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Breathing rotation
    meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.2;
    meshRef.current.rotation.y += 0.002;

    // Pulse distortion
    if (materialRef.current) {
      // Subtle pulse when resting, intense when awaking
      const baseDistort = isAwake ? 0.3 : 0.15;
      materialRef.current.distort = THREE.MathUtils.lerp(
        materialRef.current.distort,
        baseDistort + Math.sin(state.clock.elapsedTime * 1.5) * 0.05,
        0.05
      );
    }
    
    // Scale animation on awake
    const targetScale = isAwake ? 3 : 1;
    meshRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.02);
  });

  return (
    <Sphere ref={meshRef} args={[1, 64, 64]}>
      <MeshDistortMaterial
        ref={materialRef}
        color="#D4A5FF" // MoodMirror Moonlight Hopeful Core
        emissive="#2A2438" // Deep purple core
        envMapIntensity={2.5}
        clearcoat={1}
        clearcoatRoughness={0.1}
        metalness={0.2}
        roughness={0.1}
        transmission={0.95}
        thickness={2}
        ior={1.4}
        distort={0.15}
        speed={1}
      />
    </Sphere>
  );
};
