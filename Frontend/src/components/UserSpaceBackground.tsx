export function UserSpaceBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Pure black space background */}
      <div className="absolute inset-0 bg-black"></div>
      
      {/* Subtle starfield - minimal and faint */}
      <div className="absolute inset-0">
        {[...Array(150)].map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.3 + 0.1,
              animation: `pulse-glow ${Math.random() * 4 + 3}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
