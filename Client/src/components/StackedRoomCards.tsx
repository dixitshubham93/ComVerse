import { useState ,useMemo, useRef, Suspense} from 'react';
import type React from 'react';
import { Phone, Image, MessageCircle, Megaphone, X } from 'lucide-react';

interface Room {
  id: string;
  name: string;
  description: string;
  activeUsers: number;
  type: 'voice' | 'memes' | 'general' | 'announcements';
}

interface StackedRoomCardsProps {
  onRoomSelect: (room: Room) => void;
  isMotionReduced?: boolean;
}

const roomStacks = {
  voice: [
    { id: 'v1', name: 'Main Voice Lounge', description: 'General voice chat', activeUsers: 12, type: 'voice' as const },
    { id: 'v2', name: 'Gaming Voice', description: 'Gaming sessions', activeUsers: 8, type: 'voice' as const },
    { id: 'v3', name: 'Music Jam', description: 'Share music together', activeUsers: 5, type: 'voice' as const },
    { id: 'v4', name: 'Study Room', description: 'Quiet co-working', activeUsers: 3, type: 'voice' as const },
  ],
  memes: [
    { id: 'm1', name: 'Meme Central', description: 'Best memes here', activeUsers: 45, type: 'memes' as const },
    { id: 'm2', name: 'Art & Creations', description: 'Share your art', activeUsers: 23, type: 'memes' as const },
    { id: 'm3', name: 'Video Vault', description: 'Cool videos', activeUsers: 18, type: 'memes' as const },
    { id: 'm4', name: 'Screenshots', description: 'Gaming screenshots', activeUsers: 12, type: 'memes' as const },
  ],
  general: [
    { id: 'g1', name: 'General Chat', description: 'Main discussion', activeUsers: 67, type: 'general' as const },
    { id: 'g2', name: 'Tech Talk', description: 'Technology discussion', activeUsers: 34, type: 'general' as const },
    { id: 'g3', name: 'Random', description: 'Random topics', activeUsers: 29, type: 'general' as const },
    { id: 'g4', name: 'Help & Support', description: 'Get help here', activeUsers: 15, type: 'general' as const },
  ],
  announcements: [
    { id: 'a1', name: 'News & Updates', description: 'Latest updates', activeUsers: 156, type: 'announcements' as const },
    { id: 'a2', name: 'Events', description: 'Upcoming events', activeUsers: 89, type: 'announcements' as const },
    { id: 'a3', name: 'Rules', description: 'Community guidelines', activeUsers: 42, type: 'announcements' as const },
  ],
};

const stackConfig = {
  voice: { title: 'Voice Call', icon: Phone, color: '#28f5cc', floatDelay: 0 },
  memes: { title: 'Memes & Posts', icon: Image, color: '#04ad7b', floatDelay: 1.2 },
  general: { title: 'General Chat', icon: MessageCircle, color: '#28f5cc', floatDelay: 2.4 },
  announcements: { title: 'Announcements', icon: Megaphone, color: '#04ad7b', floatDelay: 3.6 },
};
/* ---------- ExpandedRoom3D - drop-in for expanded grid ---------- */
/* Requires: react, three, @react-three/fiber, @react-three/drei, lucide-react */

import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Plane, Sphere, Environment } from "@react-three/drei";
import {  Users, Speaker, Zap, Edit2 } from "lucide-react";

/** Small helper to pick icon */
function iconForType(type) {
  switch (type) {
    case "voice":
      return <Speaker className="w-4 h-4" />;
    case "chat":
      return <MessageCircle className="w-4 h-4" />;
    case "memes":
      return <Zap className="w-4 h-4" />;
    case "announcements":
    case "announce":
      return <Users className="w-4 h-4" />;
    default:
      return null;
  }
}

/* FloatingRoomCard adapted to your room object */
function FloatingRoomCard3D({ room, pos, onSelect, isOwner, isCentered, isOtherCentered, onOpenRoom }) {
  const groupRef = useRef();
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [hovered, setHovered] = useState(false);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });
  const targetPos = useRef(isCentered ? [0, 0, 5] : [pos.x, pos.y, pos.z]);

  useFrame(({ camera }) => {
    if (groupRef.current) {
      groupRef.current.lookAt(camera.position);
      
      // Smooth animation to target position
      const current = groupRef.current.position;
      const target = isCentered ? new THREE.Vector3(0, 0, 5) : new THREE.Vector3(pos.x, pos.y, pos.z);
      current.lerp(target, 0.1); // Smooth interpolation
    }
  });

  const handleCardAction = (e) => {
    e.stopPropagation();
    // If already focused, open the room right away; otherwise focus it first
    if (isCentered) {
      onOpenRoom(room, e);
    } else {
      onSelect(room, e);
    }
  };

  const handlePointerMove = (e) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    setTilt({ x: y * -8, y: x * 10 });
  };

  const handlePointerLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const cardScale = isCentered ? 1.18 : (hovered ? 1.14 : 1);
  // Only blur if another card is centered (not this one)
  const cardOpacity = isOtherCentered ? 0.4 : 1;
  const cardBlur = isCentered ? "none" : (isOtherCentered ? "blur(3px)" : "none");

  return (
    <group ref={groupRef} position={[pos.x, pos.y, pos.z]}>
      <Plane args={[4.5, 6]} onClick={(e) => { e.stopPropagation(); onSelect(room, e); }} onPointerOver={(e) => { e.stopPropagation(); setHovered(true); document.body.style.cursor = "pointer"; }} onPointerOut={(e) => { e.stopPropagation(); setHovered(false); document.body.style.cursor = "auto"; }}>
        <meshBasicMaterial transparent opacity={0} />
      </Plane>

      <Html transform distanceFactor={10} position={[0, 0, 0.01]} style={{ pointerEvents: "none", transition: "all 380ms cubic-bezier(.2,.9,.2,1)", transform: `scale(${cardScale})`, opacity: cardOpacity, filter: cardBlur }}>
        <div
          ref={cardRef}
          role="button"
          onClick={handleCardAction}
          onDoubleClick={handleCardAction}
          onMouseMove={handlePointerMove}
          onMouseLeave={handlePointerLeave}
          className="w-[220px] h-[300px] rounded-xl select-none relative"
          style={{
            background: "radial-gradient(circle at 20% 20%, rgba(40,245,204,0.14), rgba(4,18,18,0.1)), linear-gradient(180deg, rgba(6,22,20,0.95), rgba(11,26,24,0.9))",
            border: "1px solid rgba(40,245,204,0.32)",
            backdropFilter: "blur(6px)",
            transform: `scale(${cardScale}) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg)`,
            transformStyle: "preserve-3d",
            boxShadow: isCentered 
              ? "0 0 40px rgba(40,245,204,0.35), 0 0 60px rgba(40,245,204,0.18), 0 24px 60px rgba(4,55,47,0.5)" 
              : (hovered ? "0 24px 60px rgba(4,55,47,0.5)" : "0 12px 28px rgba(0,0,0,0.6)"),
            pointerEvents: "auto",
          }}
        >
          <div className="p-4 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "4px 8px", borderRadius: 8, background: "rgba(4,55,47,0.4)", border: "1px solid rgba(40,245,204,0.15)" }}>
                  <span style={{ marginRight: 6 }}>{iconForType(room.type)}</span>
                  <span style={{ color: "#28f5cc", textTransform: "uppercase", fontSize: 11, letterSpacing: 0.6, fontWeight: 600 }}>{room.type}</span>
                </div>

                <div style={{ opacity: 0.95 }}>
                  {isOwner ? <Edit2 className="w-4 h-4 text-[#9aa0aa]" /> : null}
                </div>
              </div>

              <h3 className="text-white font-semibold leading-tight mb-2" style={{ minHeight: 48, fontSize: isCentered ? "20px" : "18px" }}>{room.name}</h3>
              <p className="line-clamp-2 mb-3" style={{ color: "#a0aec0", fontSize: "13px" }}>{room.description}</p>
            </div>

            <div className="flex items-center justify-between" style={{ fontSize: isCentered ? "13px" : "12px" }}>
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#28f5cc" /></svg>
                  <span style={{ color: "#a0aec0" }}>{room.activeUsers}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Users className="w-4 h-4 text-[#28f5cc]" />
                  <span style={{ color: "#a0aec0" }}>{room.totalMembers ?? "-"}</span>
                </div>
              </div>

              <div style={{ color: "#747c88" }}>{room.lastActivity ?? ""}</div>
            </div>
          </div>

          {/* Open Room CTA - appears when centered */}
          {isCentered && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenRoom(room, e);
              }}
              className="absolute top-4 right-4 px-3.5 py-2 rounded-lg transition-all duration-200 hover:scale-105"
              style={{
                background: "linear-gradient(135deg,#04ad7b,#28f5cc)",
                color: "#041f1a",
                fontWeight: "600",
                fontSize: "13px",
                boxShadow: "0 8px 24px rgba(40,245,204,0.35)",
                pointerEvents: "auto",
              }}
            >
              Open Room
            </button>
          )}
        </div>
      </Html>
    </group>
  );
}

/* Card positions generator (spherical/spiral like 21st demo) */
function calcPositions(count) {
  const positions = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  for (let i = 0; i < count; i++) {
    const y = 1 - (i / Math.max(1, count - 1)) * 2;
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = (2 * Math.PI * i) / goldenRatio;
    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;
    const layerRadius = 10 + (i % 3) * 4;
    positions.push({ x: x * layerRadius, y: y * layerRadius, z: z * layerRadius, rotationX: 0, rotationY: 0, rotationZ: (Math.random() - 0.5) * 0.2 });
  }
  return positions;
}

/* Room modal (selected) */
function RoomModal3D({ room, onClose, isOwner, onOpen }) {
  if (!room) return null;
  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="relative max-w-2xl w-full mx-4">
        <button onClick={onClose} className="absolute -top-12 right-0 text-white z-50">
          <X className="w-8 h-8" />
        </button>
        <div className="bg-[#0b1a19] rounded-2xl p-6" style={{ border: "1px solid rgba(40,245,204,0.12)", boxShadow: "0 12px 40px rgba(0,0,0,0.6)" }}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg" style={{ background: "linear-gradient(135deg,#04372f,#2a3444)" }}>
                  {iconForType(room.type)}
                </div>
                <div>
                  <h2 className="text-white text-2xl font-semibold">{room.name}</h2>
                  <p className="text-[#747c88]">{room.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-sm text-[#747c88] mt-2">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  <span>{room.totalMembers ?? "-" } members</span>
                </div>
                <div className="flex items-center gap-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="5" fill="#28f5cc" /></svg>
                  <span>{room.activeUsers} active</span>
                </div>
                <div>{room.lastActivity}</div>
              </div>
            </div>

            <div className="flex flex-col items-end gap-3">
              {isOwner && <button className="px-4 py-2 rounded-lg bg-[#28f5cc] text-black font-semibold">Edit Room</button>}
              <button onClick={() => onOpen(room)} className="px-4 py-2 rounded-lg border border-[#28f5cc66] text-[#28f5cc]">Open Room</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ExpandedRoom3D component (use this where the grid was) */
function ExpandedRoom3D({ title, rooms, onRoomOpen }) {
  const [centeredRoom, setCenteredRoom] = useState(null);
  const [isOwner] = useState(true); // wire to real auth
  const positions = useMemo(() => calcPositions(rooms.length), [rooms.length]);

  const handleOpenRoom = (room, e) => {
    const rect = e?.currentTarget?.getBoundingClientRect?.() || {
      left: window.innerWidth / 2 - 120,
      top: window.innerHeight / 2 - 160,
      width: 240,
      height: 320,
    };

    onRoomOpen(room, {
      currentTarget: { getBoundingClientRect: () => rect },
      clientX: e?.clientX ?? rect.left + rect.width / 2,
      clientY: e?.clientY ?? rect.top + rect.height / 2,
    });
  };

  const handleCardClick = (room, e) => {
    if (centeredRoom?.id === room.id) {
      handleOpenRoom(room, e);
    } else {
      setCenteredRoom(room);
    }
  };

  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && centeredRoom) {
      setCenteredRoom(null);
    }
  };

  return (
    <div className="w-full h-full">
      {/* 3D canvas area - full width and full height */}
      <div 
        className="w-full h-full"
        style={{ position: "relative", overflow: "hidden" }}
        onClick={handleBackdropClick}
      >
        {/* subtle starry background similar to 21st gallery */}
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(circle at 20% 20%, rgba(40,245,204,0.06), transparent 35%), radial-gradient(circle at 80% 30%, rgba(4,173,123,0.08), transparent 32%), linear-gradient(135deg, rgba(4,18,18,0.75), rgba(5,12,16,0.95))" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ maskImage: "radial-gradient(circle at 50% 40%, black 0%, transparent 60%)", background: "repeating-linear-gradient(90deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 60px), repeating-linear-gradient(0deg, rgba(255,255,255,0.04) 0, rgba(255,255,255,0.04) 1px, transparent 1px, transparent 60px)" }} />

        {/* Dimmed background overlay when card is centered */}
        {centeredRoom && (
          <div 
            className="absolute inset-0 z-20 pointer-events-none"
            style={{
              background: "rgba(0,0,0,0.28)",
              transition: "all 380ms cubic-bezier(.2,.9,.2,1)",
            }}
          />
        )}

        <Canvas camera={{ position: [0, 0, 18], fov: 60 }} className="absolute inset-0 z-10" onCreated={({ gl }) => { gl.domElement.style.pointerEvents = "auto"; }}>
          <Suspense fallback={null}>
            <Environment preset="night" />
            <ambientLight intensity={0.4} />
            <pointLight position={[10, 10, 10]} intensity={0.6} />
            <pointLight position={[-10, -10, -10]} intensity={0.3} />

            {/* subtle wireframe spheres for depth */}
            <Sphere args={[2, 32, 32]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#1a1a2e" transparent opacity={centeredRoom ? 0.06 : 0.12} wireframe />
            </Sphere>
            <Sphere args={[12, 32, 32]} position={[0, 0, 0]}>
              <meshStandardMaterial color="#31b8c6" transparent opacity={centeredRoom ? 0.02 : 0.05} wireframe />
            </Sphere>

            {/* floating room cards */}
            {rooms.map((r, i) => (
              <FloatingRoomCard3D 
                key={r.id} 
                room={r} 
                pos={positions[i]} 
                onSelect={handleCardClick} 
                isOwner={isOwner}
                isCentered={centeredRoom?.id === r.id}
                isOtherCentered={centeredRoom && centeredRoom.id !== r.id}
                onOpenRoom={handleOpenRoom}
              />
            ))}

            <OrbitControls 
              enablePan 
              enableZoom 
              enableRotate 
              rotateSpeed={0.6} 
              zoomSpeed={1.2} 
              panSpeed={0.8} 
              minDistance={6} 
              maxDistance={40}
              enabled={!centeredRoom}
            />
          </Suspense>
        </Canvas>

        {/* header overlay - single title */}
        <div style={{ position: "absolute", left: 16, top: 12, zIndex: 20, pointerEvents: "none" }}>
          <h3 className="text-white font-semibold text-2xl">{title}</h3>
        </div>
      </div>
    </div>
  );
}

export function StackedRoomCards({ onRoomSelect, isMotionReduced = false }: StackedRoomCardsProps) {
  const [selectedStack, setSelectedStack] = useState<keyof typeof roomStacks | null>(null);
  const [rocketPosition, setRocketPosition] = useState<{ x: number; y: number } | null>(null);
  const [isRocketFlying, setIsRocketFlying] = useState(false);
  const [targetRoom, setTargetRoom] = useState<Room | null>(null);
  const [hoveredStack, setHoveredStack] = useState<keyof typeof roomStacks | null>(null);

  const handleStackClick = (stackType: keyof typeof roomStacks) => {
    if (selectedStack === stackType) {
      setSelectedStack(null);
    } else {
      setSelectedStack(stackType);
    }
  };

  const handleRoomClick = (room: Room, event?: any) => {
    if (isMotionReduced) {
      onRoomSelect(room);
      return;
    }

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const targetX = rect.left + rect.width / 2;
    const targetY = rect.top + rect.height / 2;

    setRocketPosition({ x: event.clientX, y: event.clientY });
    setTargetRoom(room);
    setIsRocketFlying(true);

    // Animate rocket to target
    setTimeout(() => {
      setRocketPosition({ x: targetX, y: targetY });
    }, 50);

    // Complete animation and open room
    setTimeout(() => {
      setIsRocketFlying(false);
      setRocketPosition(null);
      setTargetRoom(null);
      onRoomSelect(room);
    }, 470);
  };

  return (
    <div className={`relative w-full ${selectedStack ? 'h-full p-0' : 'h-full p-8'}`}>
      {/* Stacks View */}
      {!selectedStack && (
        <div className="grid grid-cols-2 gap-x-24 gap-y-12 max-w-6xl mx-auto pt-8">
          {(Object.keys(roomStacks) as Array<keyof typeof roomStacks>).map((stackType) => {
            const config = stackConfig[stackType];
            const rooms = roomStacks[stackType];
            const Icon = config.icon;

            return (
              <div
                key={stackType}
                className="flex flex-col items-center cursor-pointer group stack-container"
                onClick={() => handleStackClick(stackType)}
                onMouseEnter={() => setHoveredStack(stackType)}
                onMouseLeave={() => setHoveredStack(null)}
                style={{
                  animationDelay: `${config.floatDelay}s`,
                }}
              >
                {/* Stacked Cards */}
                <div
                  className="relative w-full max-w-[340px] transition-all duration-200 ease-out"
                  style={{
                    height: '240px',
                    transform: hoveredStack === stackType ? 'translateY(-3px)' : 'translateY(0)',
                    filter: hoveredStack === stackType ? 'drop-shadow(0 0 20px rgba(40, 245, 204, 0.3))' : 'none',
                  }}
                >
                  {rooms.map((room, index) => (
                    <div
                      key={room.id}
                      className="absolute w-full h-[200px] rounded-2xl transition-all duration-[360ms]"
                      style={{
                        left: index === 0 ? '0' : `${index * 12}px`,
                        top: index === 0 ? '0' : `${index * 12}px`,
                        opacity: index === 0 ? 1 : 0.7 - index * 0.12,
                        zIndex: rooms.length - index,
                        background: 'rgba(4, 55, 47, 0.3)',
                        backdropFilter: 'blur(12px)',
                        border: index === 0
                          ? hoveredStack === stackType
                            ? '1.5px solid rgba(40, 245, 204, 0.4)'
                            : '1px solid rgba(40, 245, 204, 0.25)'
                          : '1px solid rgba(40, 245, 204, 0.15)',
                        boxShadow:
                          index === 0
                            ? hoveredStack === stackType
                              ? '0 16px 48px rgba(0, 0, 0, 0.6), 0 0 30px rgba(40, 245, 204, 0.25), inset 0 1px 0 rgba(255, 255, 255, 0.05)'
                              : '0 12px 40px rgba(0, 0, 0, 0.5), 0 0 20px rgba(40, 245, 204, 0.15), inset 0 1px 0 rgba(255, 255, 255, 0.03)'
                            : '0 6px 20px rgba(0, 0, 0, 0.3)',
                      }}
                    >
                      {index === 0 && (
                        <div className="p-6 h-full flex flex-col">
                          {/* Category Title with Icon */}
                          <div className="flex items-center gap-2 mb-3 pb-2" style={{ borderBottom: '1px solid rgba(40, 245, 204, 0.2)' }}>
                            <Icon className="w-5 h-5 text-[#28f5cc]" />
                            <span className="text-[#28f5cc] flex-1" style={{ fontSize: '0.875rem', fontWeight: '600', letterSpacing: '0.5px', textTransform: 'uppercase' }}>
                              {config.title}
                            </span>
                            {/* Room count badge inline with title */}
                            <span 
                              className="px-2.5 py-1 rounded-full text-center"
                              style={{
                                background: 'rgba(40, 245, 204, 0.15)',
                                border: '1px solid rgba(40, 245, 204, 0.35)',
                                color: '#28f5cc',
                                fontSize: '0.75rem',
                                fontWeight: '600',
                              }}
                            >
                              {rooms.length}
                            </span>
                          </div>
                          
                          <h4 className="text-white mb-2.5" style={{ fontWeight: '600' }}>{room.name}</h4>
                          <p className="text-[#747c88] mb-5" style={{ fontSize: '0.9375rem', lineHeight: '1.5' }}>
                            {room.description}
                          </p>
                          <div className="mt-auto flex items-center gap-2.5">
                            <div 
                              className="w-2.5 h-2.5 rounded-full bg-[#28f5cc]" 
                              style={{ boxShadow: '0 0 8px rgba(40, 245, 204, 0.6)' }}
                            />
                            <span className="text-[#747c88]" style={{ fontSize: '0.875rem' }}>
                              {room.activeUsers} active
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Expanded Stack View */}
      {selectedStack && (
        <div
          className="absolute inset-0 animate-in fade-in zoom-in-95 duration-[500ms]"
          style={{
            animationTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
            zIndex: 30,
          }}
        >
          {/* Close Button */}
          <button
            onClick={() => setSelectedStack(null)}
            className="absolute top-4 right-4 z-50 p-3 rounded-full transition-all duration-200 hover:scale-110"
            style={{
              background: 'rgba(0, 0, 0, 0.6)',
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(40, 245, 204, 0.3)',
            }}
          >
            <X className="w-5 h-5 text-[#28f5cc]" />
          </button>

          <ExpandedRoom3D
            title={stackConfig[selectedStack].title}
            rooms={roomStacks[selectedStack]}
            onRoomOpen={handleRoomClick}
          />
        </div>
      )}

      {/* Background Blur/Dim when stack selected */}
      {selectedStack && (
        <div
          className="fixed inset-0 pointer-events-none animate-in fade-in duration-[320ms]"
          style={{
            background: 'rgba(0, 0, 0, 0.5)',
            backdropFilter: 'blur(6px)',
            zIndex: -1,
          }}
        />
      )}

      {/* Rocket Cursor */}
      {isRocketFlying && rocketPosition && (
        <div
          className="fixed pointer-events-none z-50 transition-all duration-[420ms]"
          style={{
            left: rocketPosition.x,
            top: rocketPosition.y,
            transform: 'translate(-50%, -50%)',
            transitionTimingFunction: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
          }}
        >
          <svg
            width="32"
            height="32"
            viewBox="0 0 24 24"
            fill="none"
            className="animate-pulse"
          >
            <path
              d="M12 2L15 8L21 9L16 14L18 21L12 17L6 21L8 14L3 9L9 8L12 2Z"
              fill="#28f5cc"
              stroke="#04ad7b"
              strokeWidth="1.5"
            />
            {/* Flame effect */}
            <circle cx="12" cy="20" r="3" fill="#ff6b35" opacity="0.6" className="animate-ping" />
          </svg>
        </div>
      )}

      {/* CSS for celestial platform animation */}
      <style>{`
        @keyframes float-celestial {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
        .celestial-platform {
          animation: float-celestial 3s ease-in-out infinite;
        }
        
        @keyframes gentle-float-1 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2px); }
        }
        
        @keyframes gentle-float-2 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-1.5px); }
        }
        
        @keyframes gentle-float-3 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-3px); }
        }
        
        @keyframes gentle-float-4 {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-2.5px); }
        }
        
        .stack-container:nth-child(1) {
          animation: gentle-float-1 4.5s ease-in-out infinite;
        }
        
        .stack-container:nth-child(2) {
          animation: gentle-float-2 5.2s ease-in-out infinite;
        }
        
        .stack-container:nth-child(3) {
          animation: gentle-float-3 4.8s ease-in-out infinite;
        }
        
        .stack-container:nth-child(4) {
          animation: gentle-float-4 5.5s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}