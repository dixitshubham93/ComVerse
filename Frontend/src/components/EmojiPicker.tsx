import { useState } from 'react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
}

const EMOJI_CATEGORIES = [
  {
    name: 'Smileys',
    emojis: ['😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '😇', '🙂', '🙃', '😉', '😌', '😍', '🥰', '😘', '😗', '😙', '😚', '😋'],
  },
  {
    name: 'Gestures',
    emojis: ['👍', '👎', '👌', '✌️', '🤞', '🤟', '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '👏', '🙌', '👐', '🤲', '🤝', '🙏', '✍️'],
  },
  {
    name: 'Hearts',
    emojis: ['❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '♥️'],
  },
  {
    name: 'Objects',
    emojis: ['🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🥈', '🥉', '⭐', '🌟', '✨', '💫', '🔥', '💥', '💯', '✅', '🚀', '🎯', '💡', '⚡'],
  },
];

export function EmojiPicker({ onSelectEmoji }: EmojiPickerProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button
          className="p-2 rounded-lg glassmorphism hover:border-[#28f5cc] transition-all duration-200"
          style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.2)' }}
        >
          <Smile className="w-5 h-5 text-[#747c88] hover:text-[#28f5cc] transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        className="glassmorphism border-[#04372f] p-4 w-80"
        style={{
          boxShadow: '0 0 30px rgba(40, 245, 204, 0.3)',
          background: 'rgba(42, 52, 68, 0.95)',
        }}
      >
        <div className="space-y-4">
          {EMOJI_CATEGORIES.map((category) => (
            <div key={category.name}>
              <p className="text-[#747c88] text-sm mb-2">{category.name}</p>
              <div className="grid grid-cols-10 gap-1">
                {category.emojis.map((emoji) => (
                  <button
                    key={emoji}
                    className="w-8 h-8 rounded hover:bg-[#04372f] transition-all duration-200 flex items-center justify-center text-lg"
                    style={{
                      filter: 'none',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = 'scale(1.3)';
                      e.currentTarget.style.filter = 'drop-shadow(0 0 8px rgba(40, 245, 204, 0.5))';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = 'scale(1)';
                      e.currentTarget.style.filter = 'none';
                    }}
                    onClick={() => {
                      onSelectEmoji(emoji);
                      setIsOpen(false);
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
