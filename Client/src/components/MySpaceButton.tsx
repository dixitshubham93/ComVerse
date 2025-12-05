import { Sparkles } from 'lucide-react';

export function MySpaceButton() {
  return (
    <button className="group relative">
      {/* Outer glow */}
      <div className="absolute inset-0 rounded-full bg-[#04ad7b] blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
      
      {/* Button */}
      <div className="relative flex items-center gap-3 px-8 py-4 rounded-full bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] shadow-2xl group-hover:scale-110 transition-all duration-300">
        <Sparkles className="w-6 h-6 text-black" />
        <span className="text-lg text-black">Take me to my Space</span>
      </div>

      {/* Ring animation */}
      <div className="absolute inset-0 rounded-full border-2 border-[#04ad7b] opacity-0 group-hover:opacity-100 group-hover:scale-125 transition-all duration-500"></div>
    </button>
  );
}