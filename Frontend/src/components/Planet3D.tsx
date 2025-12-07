import { useRef, useState } from 'react';
import { useFrame, useThree, type ThreeElements } from '@react-three/fiber';
import { Html } from '@react-three/drei';

interface Planet3DProps {
  name: string;
  category: string;
  members: number;
  description: string;
  color: string;
  size: number;
  position: [number, number, number];
  orbitSpeed: number;
  orbitRadius: number;
  isSelected: boolean;
  isDimmed: boolean;
  isBlurred: boolean;
  onClick: () => void;
  isUserSpace?: boolean;
}

export function Planet3D({
  name,
  category,
  members,
  description,
  color,
  size,
  position,
  orbitSpeed,
  orbitRadius,
  isSelected,
  isDimmed,
  isBlurred,
  onClick,
  isUserSpace,
}: Planet3DProps) {
  const meshRef = useRef<ThreeElements['mesh']>(null);
  const [hovered, setHovered] = useState(false);
  const [angle, setAngle] = useState(Math.random() * Math.PI * 2);
  const { camera } = useThree();

  // Animation loop for orbit and floating
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Orbital motion around initial position
      setAngle((prev) => prev + orbitSpeed * delta);
      
      // Calculate orbital position
      const orbitX = position[0] + Math.cos(angle) * orbitRadius;
      const orbitZ = position[2] + Math.sin(angle) * orbitRadius;
      
      // Update position with smooth floating
      meshRef.current.position.x = orbitX;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 0.5) * 0.3;
      meshRef.current.position.z = orbitZ;
      
      // Subtle rotation
      meshRef.current.rotation.y += delta * 0.2;
      
      // Scale on hover or selection - smooth lerp
      const targetScale = (hovered || isSelected) ? 1.15 : 1;
      meshRef.current.scale.lerp({ x: targetScale, y: targetScale, z: targetScale } as any, 0.1);
    }
  });

  const pixelSize = size * 100;
  // Apply blur and dim for blurred state
  const finalOpacity = isBlurred ? 0.5 : (isDimmed ? 0.3 : 1);
  const blurAmount = isBlurred ? 5 : 0;
  const showInfoCard = hovered || isSelected;
  
  // Calculate camera distance for responsive scaling
  const cameraDistance = camera.position.length();
  // Card scale from 1x at close (distance 8) to 2x at far (distance 30)
  const cardScale = Math.min(Math.max((cameraDistance - 8) / 11 + 1, 1), 2);
  // Label scale from 1x at close to 1.8x at far - MORE AGGRESSIVE
  const labelScale = Math.min(Math.max((cameraDistance - 8) / 11 * 0.8 + 1, 1), 1.8);

  return (
    <group>
      <mesh
        ref={meshRef}
        position={position}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered(true);
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(false);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onClick();
        }}
      >
        {/* Invisible sphere geometry for hover detection */}
        <sphereGeometry args={[size, 32, 32]} />
        <meshBasicMaterial transparent opacity={0} />
        
        {/* Use Html to render Version 1 planet style - RESTORED AURORA COLORS */}
        <Html
          distanceFactor={8}
          center
          style={{
            pointerEvents: 'none',
            cursor: hovered ? 'pointer' : 'default',
            transition: 'all 0.3s ease-in-out',
            opacity: finalOpacity,
            filter: `blur(${blurAmount}px)`,
          }}
        >
          <div className="relative" style={{ width: `${pixelSize}px`, height: `${pixelSize}px` }}>
            {/* Version 1 Hover Glow - Soft neon outline with pulse - AURORA COLORS */}
            {(hovered || isSelected) && (
              <div
                className="absolute inset-0 rounded-full animate-pulse"
                style={{
                  width: `${pixelSize * 1.3}px`,
                  height: `${pixelSize * 1.3}px`,
                  background: `radial-gradient(circle, ${color}40, transparent 70%)`,
                  boxShadow: `0 0 30px ${color}80, 0 0 60px ${color}40`,
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  pointerEvents: 'none',
                }}
              />
            )}

            {/* Outer glow ring - AURORA COLORS */}
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-60"
              style={{
                width: `${pixelSize}px`,
                height: `${pixelSize}px`,
                background: `radial-gradient(circle, ${color}, transparent)`,
                transform: 'scale(1.5)',
              }}
            />
            
            {/* Planet body - RESTORED AURORA SPHERE STYLE */}
            <div
              className="relative rounded-full shadow-2xl"
              style={{
                width: `${pixelSize}px`,
                height: `${pixelSize}px`,
                background: `radial-gradient(circle at 30% 30%, ${color}dd, #2a3444 70%)`,
                boxShadow: `0 0 40px ${color}88, inset -20px -20px 40px rgba(0,0,0,0.5)`,
              }}
            >
              {/* Surface texture - clean and minimal */}
              <div
                className="absolute inset-0 rounded-full opacity-30"
                style={{
                  background: `radial-gradient(circle at 60% 40%, rgba(255,255,255,0.3), transparent 50%)`,
                }}
              />
            </div>

            {/* Neon ring - AURORA COLORS */}
            <div
              className="absolute rounded-full border-2 opacity-70"
              style={{
                width: `${pixelSize * 1.6}px`,
                height: `${pixelSize * 0.3}px`,
                borderColor: color,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%) rotateX(75deg)',
                boxShadow: `0 0 20px ${color}`,
              }}
            />
          </div>
        </Html>
      </mesh>

      {/* ENHANCED Floating name label - FULLY VISIBLE with distance scaling */}
      <Html
        position={[position[0], position[1] + size * 1.8, position[2]]}
        distanceFactor={8}
        center
        style={{ pointerEvents: 'none' }}
      >
        <div
          className="text-center whitespace-nowrap px-4 py-2 rounded-lg transition-all duration-300"
          style={{
            color: '#ffffff',
            fontWeight: 700,
            fontSize: `${16 * labelScale}px`,
            textShadow: `0 0 10px #28f5cc, 0 0 20px #28f5ccaa, 0 2px 4px rgba(0,0,0,0.8)`,
            background: isUserSpace ? 'rgba(0, 0, 0, 0.2)' : 'rgba(4, 55, 47, 0.25)',
            backdropFilter: isUserSpace ? 'blur(4px)' : 'blur(6px)',
            border: `1px solid #28f5cc${isUserSpace ? '33' : '55'}`,
            boxShadow: `0 0 12px #28f5cc33, 0 2px 8px rgba(0,0,0,0.3)`,
            opacity: finalOpacity,
            transform: `scale(${labelScale})`,
            transformOrigin: 'center center',
          }}
        >
          {name}
        </div>
      </Html>

      {/* Version 1 Info card on hover or selection - INCREASED SIZE + RESPONSIVE */}
      {showInfoCard && (
        <Html
          position={[position[0] + size * 2.5, position[1], position[2]]}
          distanceFactor={8}
          style={{ pointerEvents: 'none' }}
        >
          <div
            className="rounded-xl p-6 transition-all duration-300 ease-out"
            style={{
              width: `${340 * cardScale}px`,
              background: 'rgba(4, 55, 47, 0.4)',
              backdropFilter: 'blur(12px)',
              border: `1.5px solid ${color}66`,
              boxShadow: `0 8px 32px rgba(0, 0, 0, 0.4), 0 0 20px ${color}33, inset 0 0 20px rgba(40, 245, 204, 0.1)`,
              opacity: finalOpacity,
              animation: 'fadeInUp 0.3s ease-out',
              transform: `scale(${cardScale})`,
              transformOrigin: 'left center',
            }}
          >
            <h3 className="text-white mb-1">{name}</h3>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: `${color}33`,
                  color: color,
                  border: `1px solid ${color}44`,
                }}
              >
                {category}
              </span>
              <span className="text-[#747c88] text-xs">
                {members.toLocaleString()} members
              </span>
            </div>
            <p className="text-[#747c88] text-sm">{description}</p>
          </div>
        </Html>
      )}
    </group>
  );
}