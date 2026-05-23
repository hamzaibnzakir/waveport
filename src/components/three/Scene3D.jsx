import { useRef, useMemo } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { Sphere, MeshDistortMaterial, Float, Stars } from "@react-three/drei";
import * as THREE from "three";

function GlobeCore() {
  const meshRef = useRef();

  useFrame((state) => {
    if (meshRef.current) {
      meshRef.current.rotation.y += 0.003;
      meshRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.2) * 0.05;
    }
  });

  return (
    <Float speed={1.2} rotationIntensity={0.3} floatIntensity={0.4}>
      <mesh ref={meshRef} scale={2.2}>
        <sphereGeometry args={[1, 64, 64]} />
        <MeshDistortMaterial
          color="#1a3a6e"
          attach="material"
          distort={0.18}
          speed={1.5}
          roughness={0.1}
          metalness={0.6}
          wireframe={false}
        />
      </mesh>
      {/* Glowing wireframe overlay */}
      <mesh scale={2.28}>
        <sphereGeometry args={[1, 24, 24]} />
        <meshBasicMaterial
          color="#4a7eff"
          wireframe
          transparent
          opacity={0.12}
        />
      </mesh>
    </Float>
  );
}

function DataParticles() {
  const points = useRef();
  const count = 120;

  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3.2 + Math.random() * 1.8;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      pos[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      pos[i * 3 + 2] = r * Math.cos(phi);
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (points.current) {
      points.current.rotation.y += 0.001;
      points.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.1) * 0.05;
    }
  });

  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#00d4e8"
        size={0.04}
        transparent
        opacity={0.7}
        sizeAttenuation
      />
    </points>
  );
}

function OrbitRing({ radius, tilt, speed, color }) {
  const ring = useRef();

  useFrame(() => {
    if (ring.current) ring.current.rotation.z += speed;
  });

  return (
    <mesh ref={ring} rotation={[tilt, 0, 0]}>
      <torusGeometry args={[radius, 0.008, 16, 120]} />
      <meshBasicMaterial color={color} transparent opacity={0.25} />
    </mesh>
  );
}

export default function Scene3D({ style }) {
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", ...style }}>
      <Canvas
        camera={{ position: [0, 0, 7], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: "transparent" }}
      >
        <ambientLight intensity={0.4} />
        <pointLight position={[10, 10, 10]} intensity={1.2} color="#4a7eff" />
        <pointLight position={[-8, -8, -5]} intensity={0.6} color="#00d4e8" />
        <pointLight position={[0, 0, 8]} intensity={0.3} color="#ffffff" />

        <Stars radius={80} depth={50} count={800} factor={3} fade speed={0.5} />
        <GlobeCore />
        <DataParticles />
        <OrbitRing radius={3.2} tilt={0.4} speed={0.004} color="#1d5cf5" />
        <OrbitRing radius={3.8} tilt={-0.6} speed={-0.003} color="#00d4e8" />
        <OrbitRing radius={4.4} tilt={1.1} speed={0.002} color="#4a7eff" />
      </Canvas>
    </div>
  );
}
