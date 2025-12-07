import { Search } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';

interface Community {
  name: string;
  category: string;
}

interface UserSpaceSearchBarProps {
  communities: Community[];
  onSelectCommunity: (index: number) => void;
}

export function UserSpaceSearchBar({ communities, onSelectCommunity }: UserSpaceSearchBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<Array<{ index: number; community: Community }>>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounced search with 200ms delay
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchTerm.trim()) {
        const matches = communities
          .map((community, index) => ({ index, community }))
          .filter(({ community }) => {
            const term = searchTerm.toLowerCase();
            return (
              community.name.toLowerCase().includes(term) ||
              community.category.toLowerCase().includes(term)
            );
          })
          .slice(0, 6); // Max 6 suggestions
        setSuggestions(matches);
        setShowSuggestions(matches.length > 0);
        setSelectedIndex(-1);
      } else {
        setSuggestions([]);
        setShowSuggestions(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchTerm, communities]);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex].index);
        }
        break;
      case 'Escape':
        e.preventDefault();
        setShowSuggestions(false);
        setSearchTerm('');
        inputRef.current?.blur();
        break;
    }
  };

  const handleSelectSuggestion = (index: number) => {
    onSelectCommunity(index);
    setShowSuggestions(false);
    setSearchTerm('');
    setIsExpanded(false);
  };

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative z-20" ref={searchRef}>
      {/* Collapsed Icon Button */}
      {!isExpanded && (
        <button
          onClick={() => setIsExpanded(true)}
          onMouseEnter={() => setIsExpanded(true)}
          className="rounded-full p-4 transition-all duration-300 hover:scale-110"
          style={{
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(40, 245, 204, 0.15)',
            boxShadow: '0 0 10px rgba(40, 245, 204, 0.1)',
          }}
          aria-label="Search communities"
        >
          <Search className="w-5 h-5 text-[#28f5cc]" />
        </button>
      )}

      {/* Expanded Search Input */}
      {isExpanded && (
        <div
          onMouseLeave={() => {
            if (!showSuggestions) setIsExpanded(false);
          }}
          className="rounded-2xl p-4 shadow-2xl animate-in fade-in slide-in-from-left-2 duration-300"
          style={{
            width: '320px',
            background: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(10px)',
            border: '1px solid rgba(40, 245, 204, 0.2)',
            boxShadow: '0 0 15px rgba(40, 245, 204, 0.15)',
          }}
        >
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#747c88] w-4 h-4" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search your communities..."
              autoFocus
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full rounded-xl pl-10 pr-4 py-2.5 text-white text-sm placeholder-[#747c88] focus:outline-none transition-all"
              style={{
                background: 'rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(40, 245, 204, 0.2)',
                boxShadow: '0 0 10px rgba(40, 245, 204, 0.1)',
              }}
            />
          </div>

          {/* Suggestions Panel */}
          {showSuggestions && suggestions.length > 0 && (
            <div
              className="mt-2 rounded-xl p-2 shadow-lg"
              style={{
                background: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(8px)',
                border: '1px solid rgba(40, 245, 204, 0.15)',
                boxShadow: '0 4px 16px rgba(0, 0, 0, 0.5)',
              }}
            >
              {suggestions.map(({ index, community }, idx) => (
                <button
                  key={index}
                  onClick={() => handleSelectSuggestion(index)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`w-full text-left px-3 py-2 rounded-lg transition-all duration-150 ${
                    idx === selectedIndex
                      ? 'border border-[#28f5cc]/30'
                      : 'border border-transparent'
                  }`}
                  style={{
                    background: idx === selectedIndex ? 'rgba(40, 245, 204, 0.1)' : 'transparent',
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-white text-sm font-medium truncate">
                      {community.name}
                    </span>
                    <span className="text-[#747c88] text-xs whitespace-nowrap">
                      {community.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Accessibility announcement */}
      <div role="status" aria-live="polite" className="sr-only">
        {showSuggestions && suggestions.length > 0
          ? `${suggestions.length} suggestions available. Use arrow keys to navigate, Enter to select, Escape to close.`
          : ''}
      </div>
    </div>
  );
}
