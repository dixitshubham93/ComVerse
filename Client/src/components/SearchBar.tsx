import { Search } from 'lucide-react';

export function SearchBar() {
  return (
    <div className="relative z-20 w-full max-w-4xl mx-auto px-4">
      <div className="glassmorphism rounded-2xl p-6 shadow-2xl">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search Input */}
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#747c88] w-5 h-5" />
            <input
              type="text"
              placeholder="Search communities by name or category…"
              className="w-full bg-[#2a3444] border border-[#28f5cc]/30 rounded-xl pl-12 pr-4 py-3 text-white placeholder-[#747c88] focus:outline-none focus:border-[#28f5cc] focus:shadow-[0_0_20px_rgba(40,245,204,0.3)] transition-all"
            />
          </div>

          {/* Category Dropdown */}
          <select className="bg-[#2a3444] border border-[#28f5cc]/30 rounded-xl px-6 py-3 text-white focus:outline-none focus:border-[#28f5cc] focus:shadow-[0_0_20px_rgba(40,245,204,0.3)] transition-all cursor-pointer">
            <option value="">All Categories</option>
            <option value="tech">Technology</option>
            <option value="art">Art & Design</option>
            <option value="gaming">Gaming</option>
            <option value="music">Music</option>
            <option value="science">Science</option>
            <option value="sports">Sports</option>
          </select>
        </div>
      </div>
    </div>
  );
}
