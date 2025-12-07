import { useState } from 'react';

interface PlanetProps {
  name: string;
  category: string;
  members: number;
  description: string;
  color: string;
  size: number;
  position: { x: number; y: number };
  delay: number;
}

export function Planet({ name, category, members, description, color, size, position, delay }: PlanetProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="absolute cursor-pointer transition-all duration-500"
      style={{
        left: `${position.x}%`,
        top: `${position.y}%`,
        animationDelay: `${delay}s`,
        transform: isHovered ? 'scale(1.1)' : 'scale(1)',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Planet sphere */}
      <div className="relative float-animation">
        {/* Outer glow ring */}
        <div
          className="absolute inset-0 rounded-full blur-xl opacity-60"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            background: `radial-gradient(circle, ${color}, transparent)`,
            transform: 'scale(1.5)',
          }}
        />
        
        {/* Planet body */}
        <div
          className="relative rounded-full shadow-2xl"
          style={{
            width: `${size}px`,
            height: `${size}px`,
            background: `radial-gradient(circle at 30% 30%, ${color}dd, #2a3444 70%)`,
            boxShadow: `0 0 40px ${color}88, inset -20px -20px 40px rgba(0,0,0,0.5)`,
          }}
        >
          {/* Surface texture */}
          <div
            className="absolute inset-0 rounded-full opacity-30"
            style={{
              background: `radial-gradient(circle at 60% 40%, rgba(255,255,255,0.3), transparent 50%)`,
            }}
          />
        </div>

        {/* Neon ring */}
        <div
          className="absolute rounded-full border-2 opacity-70"
          style={{
            width: `${size * 1.6}px`,
            height: `${size * 0.3}px`,
            borderColor: color,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%) rotateX(75deg)',
            boxShadow: `0 0 20px ${color}`,
          }}
        />

        {/* Info card on hover */}
        {isHovered && (
          <div
            className="absolute left-full ml-6 top-1/2 -translate-y-1/2 w-64 glassmorphism rounded-xl p-4 shadow-2xl animate-in fade-in slide-in-from-left-2 duration-300"
            style={{
              border: `1px solid ${color}44`,
            }}
          >
            <h3 className="text-white mb-1">{name}</h3>
            <div className="flex items-center gap-2 mb-2">
              <span
                className="text-xs px-2 py-1 rounded-full"
                style={{
                  backgroundColor: `${color}33`,
                  color: color,
                }}
              >
                {category}
              </span>
              <span className="text-[#747c88] text-xs">{members.toLocaleString()} members</span>
            </div>
            <p className="text-[#747c88] text-sm">{description}</p>
          </div>
        )}
      </div>
    </div>
  );
}
