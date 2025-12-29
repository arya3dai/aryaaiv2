import React, { useRef, useState, useEffect, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF, Stage, Float, ContactShadows, Sphere, Box, Cylinder, Torus, Circle } from '@react-three/drei';
import { EmotionState } from '../types';
import * as THREE from 'three';

// TypeScript workaround: Extend JSX.IntrinsicElements for R3F elements
// This is necessary if @react-three/fiber types are not automatically picked up
declare global {
  namespace JSX {
    interface IntrinsicElements {
      group: any;
      meshStandardMaterial: any;
      primitive: any;
      ambientLight: any;
      spotLight: any;
      pointLight: any;
    }
  }
}

interface Avatar3DProps {
  url?: string | null;
  emotion: EmotionState;
  isSpeaking?: boolean;
}

// --- Procedural Indian Female Avatar Component ---
const IndianAvatar = ({ emotion, isSpeaking }: { emotion: EmotionState, isSpeaking: boolean }) => {
  const headGroupRef = useRef<THREE.Group>(null);
  const leftEyebrowRef = useRef<THREE.Mesh>(null);
  const rightEyebrowRef = useRef<THREE.Mesh>(null);
  const mouthRef = useRef<THREE.Group>(null);
  
  // Materials
  const skinColor = "#e0ac69"; // Wheatish tone
  const hairColor = "#1a1a1a";
  const lipColor = "#c55a5a";
  const sariColor = "#d946ef"; // Fuschia/Pink
  const goldColor = "#fbbf24";

  useFrame((state) => {
    if (!headGroupRef.current) return;
    const t = state.clock.getElapsedTime();

    // 1. Head Tracking (Look at Mouse)
    const mouseX = state.mouse.x * 0.3;
    const mouseY = state.mouse.y * 0.3;
    
    // Smooth lerp for natural movement
    headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, mouseX, 0.1);
    headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, -mouseY, 0.1);

    // 2. Idle Animation (Subtle breathing/bobbing)
    headGroupRef.current.position.y = Math.sin(t * 1) * 0.05 - 0.5; // Base offset

    // 3. Lip Sync (Simulated Visemes)
    if (mouthRef.current) {
        if (isSpeaking) {
            // Rapid sine wave to simulate talking
            const talkScale = 0.5 + Math.abs(Math.sin(t * 15)) * 0.5;
            mouthRef.current.scale.y = talkScale;
        } else {
            // Closed mouth when not speaking
            mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, 0.1, 0.2);
        }
    }

    // 4. Emotional Expression Logic
    // Default positions
    let leftBrowRot = 0;
    let rightBrowRot = 0;
    let leftBrowY = 0.35;
    let rightBrowY = 0.35;

    switch (emotion) {
        case 'happy':
            leftBrowY = 0.4; rightBrowY = 0.4; // Raised
            break;
        case 'sad':
            leftBrowRot = -0.2; rightBrowRot = 0.2; // Slanted up center
            break;
        case 'angry':
            leftBrowRot = 0.3; rightBrowRot = -0.3; // Furrowed
            leftBrowY = 0.3; rightBrowY = 0.3;
            break;
        case 'surprised':
            leftBrowY = 0.5; rightBrowY = 0.5; // High up
            break;
        case 'thinking':
            leftBrowY = 0.35; rightBrowY = 0.45; // One up one down
            break;
    }

    if (leftEyebrowRef.current && rightEyebrowRef.current) {
        leftEyebrowRef.current.rotation.z = THREE.MathUtils.lerp(leftEyebrowRef.current.rotation.z, leftBrowRot, 0.1);
        rightEyebrowRef.current.rotation.z = THREE.MathUtils.lerp(rightEyebrowRef.current.rotation.z, rightBrowRot, 0.1);
        leftEyebrowRef.current.position.y = THREE.MathUtils.lerp(leftEyebrowRef.current.position.y, leftBrowY, 0.1);
        rightEyebrowRef.current.position.y = THREE.MathUtils.lerp(rightEyebrowRef.current.position.y, rightBrowY, 0.1);
    }
  });

  return (
    <group ref={headGroupRef}>
      {/* --- HEAD --- */}
      <Sphere args={[0.85, 64, 64]}>
        <meshStandardMaterial color={skinColor} roughness={0.4} />
      </Sphere>

      {/* --- HAIR --- */}
      {/* Bun */}
      <Sphere args={[0.5, 32, 32]} position={[0, 0.6, -0.6]}>
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </Sphere>
      {/* Main Hair Mass */}
      <Sphere args={[0.9, 32, 32]} position={[0, 0.1, -0.1]} scale={[1, 1, 0.9]}>
        <meshStandardMaterial color={hairColor} roughness={0.9} />
      </Sphere>
      
      {/* --- FACE --- */}
      {/* Bindi */}
      <Circle args={[0.06, 32]} position={[0, 0.25, 0.82]} rotation={[0, 0, 0]}>
         <meshStandardMaterial color="#b91c1c" />
      </Circle>

      {/* Eyes Container */}
      <group position={[0, 0.1, 0.75]}>
         {/* Left Eye */}
         <group position={[-0.25, 0, 0]}>
            <Sphere args={[0.12, 32, 32]} scale={[1, 0.8, 0.5]}>
                <meshStandardMaterial color="white" />
            </Sphere>
            <Sphere args={[0.06, 32, 32]} position={[0, 0, 0.08]} scale={[1, 1, 0.5]}>
                <meshStandardMaterial color="#2d1b0e" />
            </Sphere>
            {/* Eyelash/Liner */}
            <Box args={[0.26, 0.02, 0.05]} position={[0, 0.08, 0.05]} rotation={[0, 0, 0.1]}>
                <meshStandardMaterial color="black" />
            </Box>
         </group>

         {/* Right Eye */}
         <group position={[0.25, 0, 0]}>
            <Sphere args={[0.12, 32, 32]} scale={[1, 0.8, 0.5]}>
                <meshStandardMaterial color="white" />
            </Sphere>
            <Sphere args={[0.06, 32, 32]} position={[0, 0, 0.08]} scale={[1, 1, 0.5]}>
                <meshStandardMaterial color="#2d1b0e" />
            </Sphere>
            {/* Eyelash/Liner */}
            <Box args={[0.26, 0.02, 0.05]} position={[0, 0.08, 0.05]} rotation={[0, 0, -0.1]}>
                <meshStandardMaterial color="black" />
            </Box>
         </group>
      </group>

      {/* Eyebrows */}
      <group position={[0, 0.1, 0.86]}>
         <Box ref={leftEyebrowRef} args={[0.25, 0.03, 0.02]} position={[-0.25, 0.35, 0]} rotation={[0, 0, 0]}>
            <meshStandardMaterial color="black" />
         </Box>
         <Box ref={rightEyebrowRef} args={[0.25, 0.03, 0.02]} position={[0.25, 0.35, 0]} rotation={[0, 0, 0]}>
            <meshStandardMaterial color="black" />
         </Box>
      </group>

      {/* Nose (Simple) */}
      <Sphere args={[0.08, 16, 16]} position={[0, -0.1, 0.85]} scale={[1, 1.5, 0.5]}>
         <meshStandardMaterial color={skinColor} roughness={0.4} /> // Slightly darker/same for nose
      </Sphere>

      {/* Mouth Group for Lip Sync */}
      <group ref={mouthRef} position={[0, -0.35, 0.82]}>
          <Sphere args={[0.15, 16, 16]} scale={[1, 0.5, 0.5]}>
             <meshStandardMaterial color={lipColor} />
          </Sphere>
      </group>

      {/* --- JEWELRY --- */}
      {/* Earrings (Jhumkas) */}
      <group position={[-0.8, -0.2, 0]}>
         <Sphere args={[0.1, 16]} position={[0, 0.1, 0]}>
            <meshStandardMaterial color={goldColor} metalness={0.8} roughness={0.2} />
         </Sphere>
         <Cylinder args={[0.02, 0.15, 0.3, 16]} position={[0, -0.15, 0]}>
            <meshStandardMaterial color={goldColor} metalness={0.8} roughness={0.2} />
         </Cylinder>
      </group>
      <group position={[0.8, -0.2, 0]}>
         <Sphere args={[0.1, 16]} position={[0, 0.1, 0]}>
            <meshStandardMaterial color={goldColor} metalness={0.8} roughness={0.2} />
         </Sphere>
         <Cylinder args={[0.02, 0.15, 0.3, 16]} position={[0, -0.15, 0]}>
            <meshStandardMaterial color={goldColor} metalness={0.8} roughness={0.2} />
         </Cylinder>
      </group>

      {/* Necklace */}
      <Torus args={[0.6, 0.05, 16, 32]} position={[0, -0.9, 0.3]} rotation={[1.5, 0, 0]}>
         <meshStandardMaterial color={goldColor} metalness={0.8} roughness={0.2} />
      </Torus>

      {/* --- CLOTHING (Sari Drape) --- */}
      <group position={[0, -1.2, 0]}>
         <Cylinder args={[0.6, 0.9, 1.2, 32]} position={[0, 0, 0]}>
            <meshStandardMaterial color={sariColor} />
         </Cylinder>
         {/* Diagonal Drape */}
         <Torus args={[0.7, 0.15, 16, 32]} position={[0, 0.2, 0.1]} rotation={[0.5, 0.5, -0.5]} scale={[1, 1, 0.5]}>
             <meshStandardMaterial color={sariColor} />
         </Torus>
      </group>

    </group>
  );
};

// --- Uploaded Model Component ---
const Model = ({ url }: { url: string }) => {
  const { scene } = useGLTF(url);
  return <primitive object={scene} />;
};

const Avatar3D: React.FC<Avatar3DProps> = ({ url, emotion, isSpeaking = false }) => {
  return (
    <div className="w-full h-full relative transition-colors duration-1000">
      <Canvas shadows dpr={[1, 2]} camera={{ fov: 35, position: [0, 0, 6] }}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <spotLight position={[10, 10, 10]} angle={0.15} penumbra={1} intensity={1} castShadow />
          <pointLight position={[-5, 5, -5]} intensity={0.5} color="pink"/>

          <Float speed={2} rotationIntensity={0.1} floatIntensity={0.2}>
            {url ? (
               <Stage environment="city" intensity={0.6}>
                  <Model url={url} />
               </Stage>
            ) : (
               <IndianAvatar emotion={emotion} isSpeaking={isSpeaking} />
            )}
          </Float>
          <ContactShadows opacity={0.4} scale={10} blur={2.5} far={4} />
        </Suspense>
        <OrbitControls enableZoom={false} enablePan={false} minPolarAngle={Math.PI/3} maxPolarAngle={Math.PI/2} />
      </Canvas>
      
      {/* HUD Info */}
      <div className="absolute bottom-2 left-0 right-0 text-center pointer-events-none flex flex-col items-center gap-1">
         <span className={`text-[10px] uppercase font-mono tracking-widest px-2 py-1 rounded bg-black/50 ${
             emotion === 'happy' ? 'text-green-400' : 
             emotion === 'sad' ? 'text-blue-400' :
             emotion === 'angry' ? 'text-red-400' :
             emotion === 'thinking' ? 'text-purple-400' : 'text-cyan-400'
         }`}>
            State: {emotion.toUpperCase()}
         </span>
         {isSpeaking && <span className="text-[10px] text-white animate-pulse">● Speaking</span>}
      </div>
    </div>
  );
};

export default Avatar3D;