export function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 px-8 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#04ad7b] to-[#28f5cc] flex items-center justify-center" style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.4)' }}>
            <span className="text-xl">✦</span>
          </div>
          <span className="text-2xl tracking-wider glow-text">COSMOS</span>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#" className="text-[#a0aab8] hover:text-[#28f5cc] transition-colors" style={{ fontWeight: 600 }}>
            Home
          </a>
          <a href="#" className="text-[#a0aab8] hover:text-[#28f5cc] transition-colors" style={{ fontWeight: 600 }}>
            Explore
          </a>
          <a href="#" className="text-[#a0aab8] hover:text-[#28f5cc] transition-colors" style={{ fontWeight: 600 }}>
            About
          </a>
        </nav>

        {/* Auth Buttons */}
        <div className="flex items-center gap-4">
          <button className="px-6 py-2 rounded-full border-2 border-[#04ad7b] text-[#04ad7b] hover:bg-[#04ad7b] hover:text-white transition-all duration-300">
            Login
          </button>
          <button className="px-6 py-2 rounded-full bg-[#28f5cc] text-black hover:scale-105 transition-transform" style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.3)' }}>
            Signup
          </button>
        </div>
      </div>
    </header>
  );
}