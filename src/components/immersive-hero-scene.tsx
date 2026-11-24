"use client";

import { Suspense, useMemo, useRef } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import * as THREE from "three";

function CameraGuide({ paused }: { paused: boolean }) {
  const { camera, pointer } = useThree();
  const cameraRef = useRef(camera);
  const elapsed = useRef(0);

  useFrame((_, delta) => {
    if (!paused) elapsed.current += delta;
    const drift = Math.sin(elapsed.current * 0.24) * 0.32;
    const activeCamera = cameraRef.current;
    activeCamera.position.x = THREE.MathUtils.lerp(activeCamera.position.x, drift + pointer.x * 0.28, 0.025);
    activeCamera.position.y = THREE.MathUtils.lerp(activeCamera.position.y, 0.2 + pointer.y * 0.16, 0.025);
    activeCamera.lookAt(0, 0, 0);
  });

  return null;
}

function Booth({
  position,
  color,
  scale = [1, 1, 1],
}: {
  position: [number, number, number];
  color: string;
  scale?: [number, number, number];
}) {
  return (
    <group position={position} scale={scale}>
      <mesh castShadow receiveShadow position={[0, -0.28, 0]}>
        <boxGeometry args={[1.42, 0.5, 1.05]} />
        <meshStandardMaterial color="#f8fafc" roughness={0.72} />
      </mesh>
      <mesh castShadow position={[0, 0.25, -0.47]}>
        <boxGeometry args={[1.48, 0.76, 0.09]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.55} />
      </mesh>
      <mesh position={[0, 0.41, -0.51]}>
        <boxGeometry args={[0.76, 0.17, 0.02]} />
        <meshBasicMaterial color={color} />
      </mesh>
      <mesh position={[0, -0.02, 0.31]}>
        <boxGeometry args={[0.62, 0.42, 0.42]} />
        <meshStandardMaterial color="#ffffff" roughness={0.5} />
      </mesh>
    </group>
  );
}

function ExhibitionScene({ paused }: { paused: boolean }) {
  const texture = useTexture("/brand/expo-sphere-event-team.webp");
  const displayTexture = useMemo(() => {
    const clone = texture.clone();
    clone.colorSpace = THREE.SRGBColorSpace;
    clone.needsUpdate = true;
    return clone;
  }, [texture]);

  return (
    <>
      <CameraGuide paused={paused} />
      <color attach="background" args={["#eaf1fb"]} />
      <fog attach="fog" args={["#eaf1fb", 5, 11]} />
      <ambientLight intensity={1.25} />
      <directionalLight castShadow intensity={2.2} position={[2.5, 4, 3]} color="#ffffff" />
      <pointLight intensity={2.4} position={[-3, 1.5, 1]} color="#60a5fa" />

      <mesh position={[0, 0.55, -3.25]} scale={[5.65, 3.25, 1]}>
        <planeGeometry />
        <meshBasicMaterial map={displayTexture} toneMapped={false} transparent opacity={0.4} />
      </mesh>

      <mesh receiveShadow rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.72, 0]}>
        <planeGeometry args={[13, 12]} />
        <meshStandardMaterial color="#eef3f9" roughness={0.85} />
      </mesh>

      <gridHelper args={[12, 24, "#bfdbfe", "#dbeafe"]} position={[0, -0.7, 0]} />
      <Booth position={[-2.45, -0.15, -1.1]} color="#2563eb" scale={[1.05, 1.05, 1.05]} />
      <Booth position={[2.35, -0.18, -1.35]} color="#f59e0b" scale={[1.12, 1.12, 1.12]} />
      <Booth position={[-1.15, -0.28, 1.15]} color="#0f172a" scale={[0.9, 0.9, 0.9]} />
      <Booth position={[1.25, -0.3, 1.3]} color="#2563eb" scale={[0.84, 0.84, 0.84]} />
    </>
  );
}

export function ImmersiveHeroScene({ paused }: { paused: boolean }) {
  return (
    <Canvas
      camera={{ position: [0, 0.2, 5.3], fov: 43 }}
      dpr={[1, 1.5]}
      gl={{ antialias: true, alpha: false, powerPreference: "high-performance" }}
      shadows
      aria-hidden="true"
    >
      <Suspense fallback={null}>
        <ExhibitionScene paused={paused} />
      </Suspense>
    </Canvas>
  );
}
