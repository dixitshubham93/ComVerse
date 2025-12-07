export function AuroraBackground() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Deep space background */}
      <div className="absolute inset-0 bg-gradient-to-b from-black via-[#2a3444] to-black"></div>
      
      {/* Stars */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.3,
              animation: `pulse-glow ${Math.random() * 3 + 2}s ease-in-out infinite`,
            }}
          />
        ))}
      </div>

      {/* Aurora waves - reduced opacity for uniform dim look */}
      <div className="aurora-wave absolute top-0 left-1/2 w-[200%] h-[200%] opacity-15">
        <div className="absolute inset-0 bg-gradient-to-b from-[#04ad7b] via-[#28f5cc] to-transparent blur-[100px] transform -translate-x-1/2"></div>
      </div>
      
      <div className="aurora-wave absolute bottom-0 left-1/2 w-[200%] h-[200%] opacity-10" style={{ animationDelay: '10s' }}>
        <div className="absolute inset-0 bg-gradient-to-t from-[#28f5cc] via-[#04ad7b] to-transparent blur-[120px] transform -translate-x-1/2"></div>
      </div>

      {/* Nebula effects - reduced opacity for uniform dim look */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#04ad7b] rounded-full blur-[150px] opacity-8 float-animation"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#28f5cc] rounded-full blur-[150px] opacity-10 float-animation" style={{ animationDelay: '3s' }}></div>
    </div>
  );
}