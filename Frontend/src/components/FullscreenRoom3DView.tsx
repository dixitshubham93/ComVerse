import { useState, useMemo, useRef, Suspense } from 'react';
import { X, Users, Speaker, MessageCircle, Zap, Edit2 } from 'lucide-react';
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Html, Plane, Sphere, Environment } from "@react-three/drei";

interface Room {
  id: string;
  name: string;
  description: string;
  activeUsers: number;
  type: 'voice' | 'memes' | 'general' | 'announcements';
  totalMembers?: number;
  lastActivity?: string;
}

/** Small helper to pick icon */
function iconForType(type: string) {
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
function FloatingRoomCard3D({ room, pos, onSelect, isOwner, isCentered, isOtherCentered, onOpenRoom }: {
  room: Room;
  pos: { x: number; y: number; z: number };
  onSelect: (room: Room, e: any) => void;
  isOwner?: boolean;
  isCentered: boolean;
  isOtherCentered: boolean;
  onOpenRoom: (room: Room, e: any) => void;
}) {
  const groupRef = useRef<any>(null);
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

  const handleCardAction = (e: any) => {
    e.stopPropagation();
    // If already focused, open the room right away; otherwise focus it first
    if (isCentered) {
      onOpenRoom(room, e);
    } else {
      onSelect(room, e);
    }
  };

  const handlePointerMove = (e: any) => {
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
              <p className="line-clamp-2 mb-3" style={{ color: "#a0aec0", fontSize: "13px" }}>
                {room.description || (room.type === 'announcements' ? 'Announcements and important updates for this community.' : '')}
              </p>
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
interface Position {
  x: number;
  y: number;
  z: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
}

function calcPositions(count: number): Position[] {
  const positions: Position[] = [];
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

/* ExpandedRoom3D component (use this where the grid was) */
export function ExpandedRoom3D({ title, rooms, onRoomOpen, isOwner, onClose }: { title: string; rooms: Room[]; onRoomOpen: any; isOwner?: boolean; onClose?: () => void }) {
  const [centeredRoom, setCenteredRoom] = useState<Room | null>(null);
  const positions = useMemo(() => calcPositions(rooms.length), [rooms.length]);

  const handleOpenRoom = (room: Room, e: any) => {
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

  const handleCardClick = (room: Room, e: any) => {
    if (centeredRoom?.id === room.id) {
      handleOpenRoom(room, e);
    } else {
      setCenteredRoom(room);
    }
  };

  const handleBackdropClick = (e: any) => {
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

        {/* Close button for 3D view */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            if (onClose) {
              onClose();
            }
          }}
          className="absolute top-4 right-4 z-30 p-3 rounded-full transition-all duration-200 hover:scale-110"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(40, 245, 204, 0.3)',
            pointerEvents: "auto",
          }}
        >
          <X className="w-5 h-5 text-[#28f5cc]" />
        </button>
      </div>
    </div>
  );
}
