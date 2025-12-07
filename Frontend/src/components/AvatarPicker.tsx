import { useState } from 'react';

interface AvatarPickerProps {
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
}

const AVATAR_OPTIONS = [
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic1',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic2',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic3',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic4',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic5',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic6',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic7',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic8',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic9',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic10',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic11',
  'https://api.dicebear.com/7.x/avataaars/svg?seed=cosmic12',
];

export function AvatarPicker({ selectedAvatar, onSelectAvatar }: AvatarPickerProps) {
  return (
    <div className="grid grid-cols-6 gap-3 mb-4">
      {AVATAR_OPTIONS.map((avatar, index) => (
        <button
          key={index}
          type="button"
          onClick={() => onSelectAvatar(avatar)}
          className={`relative w-12 h-12 rounded-full overflow-hidden border-2 transition-all hover:scale-110 ${
            selectedAvatar === avatar
              ? 'border-[#28f5cc] ring-2 ring-[#28f5cc]/50'
              : 'border-[#747c88]/30 hover:border-[#28f5cc]/50'
          }`}
          style={{
            boxShadow: selectedAvatar === avatar 
              ? '0 0 15px rgba(40, 245, 204, 0.5)' 
              : 'none'
          }}
        >
          <img
            src={avatar}
            alt={`Avatar ${index + 1}`}
            className="w-full h-full object-cover"
          />
          {selectedAvatar === avatar && (
            <div className="absolute inset-0 bg-[#28f5cc]/20 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-[#28f5cc]" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

