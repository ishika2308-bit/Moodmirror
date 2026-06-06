import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Instances, Instance } from '@react-three/drei';
import * as THREE from 'three';

interface OrbParticlesProps {
  count?: number;
  isAwake: boolean;
}

export const OrbParticles: React.FC<OrbParticlesProps> = ({ count = 40, isAwake }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  const particles = useMemo(() => {
    return new Array(count).fill(0).map(() => {
      // Random position on a sphere
      const radius = 1.2 + Math.random() * 1.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos((Math.random() * 2) - 1);
      
      const x = radius * Math.sin(phi) * Math.cos(theta);
      const y = radius * Math.sin(phi) * Math.sin(theta);
      const z = radius * Math.cos(phi);
      
      return {
        position: new THREE.Vector3(x, y, z),
        scale: 0.02 + Math.random() * 0.04,
        speed: 0.2 + Math.random() * 0.5,
        offset: Math.random() * Math.PI * 2
      };
    });
  }, [count]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // Rotate the entire particle cloud slowly
    const speed = isAwake ? 0.05 : 0.01;
    groupRef.current.rotation.y += speed;
    groupRef.current.rotation.x += speed * 0.5;
    
    // Scale out when awaking
    const targetScale = isAwake ? 1.5 : 1;
    groupRef.current.scale.lerp(new THREE.Vector3(targetScale, targetScale, targetScale), 0.05);
  });

  return (
    <group ref={groupRef}>
      <Instances limit={count} range={count}>
        <sphereGeometry args={[1, 16, 16]} />
        <meshPhysicalMaterial 
          color="#ffffff"
          transmission={0.9}
          opacity={1}
          transparent
          roughness={0}
          ior={1.5}
          thickness={0.5}
        />
        {particles.map((data, i) => (
          <Particle key={i} {...data} isAwake={isAwake} />
        ))}
      </Instances>
    </group>
  );
};

interface ParticleProps {
  position: THREE.Vector3;
  scale: number;
  speed: number;
  offset: number;
  isAwake: boolean;
}

const Particle: React.FC<ParticleProps> = ({ position, scale, speed, offset, isAwake }) => {
  const ref = useRef<THREE.InstancedMesh>(null);
  
  useFrame((state) => {
    if (!ref.current) return;
    const t = state.clock.elapsedTime * speed + offset;
    
    // Float up and down
    ref.current.position.copy(position);
    ref.current.position.y += Math.sin(t) * 0.2;
    
    // Orbit slightly
    ref.current.position.x += Math.cos(t * 0.5) * 0.1;
    ref.current.position.z += Math.sin(t * 0.5) * 0.1;
  });

  return <Instance ref={ref} position={position} scale={scale} />;
};
