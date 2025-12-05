import { useState } from 'react';
import { HoverCard, HoverCardContent, HoverCardTrigger } from './ui/hover-card';
import { MoreVertical, Reply, Smile, Trash2, Shield } from 'lucide-react';

interface ChatMessageProps {
  id: string;
  avatar: string;
  username: string;
  role: 'Owner' | 'Admin' | 'Member';
  timestamp: string;
  message: string;
  image?: string;
  reactions?: { emoji: string; count: number; users: string[] }[];
  isCurrentUser?: boolean;
  onReply?: (messageId: string) => void;
  onDelete?: (messageId: string) => void;
  onReact?: (messageId: string, emoji: string) => void;
  onUserClick?: (username: string, avatar: string) => void;
}

export function ChatMessage({
  id,
  avatar,
  username,
  role,
  timestamp,
  message,
  image,
  reactions = [],
  isCurrentUser = false,
  onReply,
  onDelete,
  onReact,
  onUserClick,
}: ChatMessageProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  const isAdmin = role === 'Owner' || role === 'Admin';

  return (
    <div
      className="group relative px-6 py-3 transition-all duration-200 hover:bg-[#2a3444]/40"
      style={{
        transform: isHovered ? 'scale(1.01)' : 'scale(1)',
        boxShadow: isHovered ? '0 0 20px rgba(40, 245, 204, 0.15)' : 'none',
        borderLeft: isHovered ? '2px solid #28f5cc' : '2px solid transparent',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setShowMenu(false);
      }}
    >
      <div className="flex gap-4">
        {/* Avatar with Hover Card */}
        <HoverCard openDelay={200}>
          <HoverCardTrigger asChild>
            <div
              className="relative flex-shrink-0 cursor-pointer"
              onClick={() => onUserClick?.(username, avatar)}
            >
              <div
                className="w-10 h-10 rounded-full overflow-hidden ring-2 ring-[#04372f] hover:ring-[#28f5cc] transition-all duration-200"
                style={{
                  boxShadow: '0 0 10px rgba(40, 245, 204, 0.2)',
                }}
              >
                <img src={avatar} alt={username} className="w-full h-full object-cover" />
              </div>
              {isAdmin && (
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-gradient-to-br from-[#04ad7b] to-[#28f5cc] flex items-center justify-center">
                  <Shield className="w-2.5 h-2.5 text-black" />
                </div>
              )}
            </div>
          </HoverCardTrigger>
          <HoverCardContent
            side="right"
            className="glassmorphism border-[#04372f] p-4 w-64"
            style={{
              boxShadow: '0 0 30px rgba(40, 245, 204, 0.3)',
            }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-3">
                <div className="w-16 h-16 rounded-full overflow-hidden ring-2 ring-[#28f5cc]">
                  <img src={avatar} alt={username} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-white">{username}</p>
                    {isAdmin && <Shield className="w-3.5 h-3.5 text-[#28f5cc]" />}
                  </div>
                  <p className="text-[#747c88] text-sm">{role}</p>
                </div>
              </div>
              <button
                className="w-full px-4 py-2 rounded-lg bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] text-black hover:opacity-90 transition-opacity"
                style={{ boxShadow: '0 0 15px rgba(40, 245, 204, 0.3)' }}
                onClick={() => onUserClick?.(username, avatar)}
              >
                Send DM
              </button>
            </div>
          </HoverCardContent>
        </HoverCard>

        {/* Message Content */}
        <div className="flex-1 min-w-0">
          {/* Header */}
          <div className="flex items-center gap-3 mb-1">
            <span
              className="cursor-pointer hover:underline"
              style={{
                color: isAdmin ? '#28f5cc' : '#ffffff',
              }}
              onClick={() => onUserClick?.(username, avatar)}
            >
              {username}
            </span>
            {isAdmin && (
              <span className="px-2 py-0.5 rounded text-xs bg-[#04ad7b]/20 text-[#28f5cc] border border-[#04ad7b]/30">
                {role}
              </span>
            )}
            <span className="text-[#747c88] text-sm">{timestamp}</span>
          </div>

          {/* Message Text */}
          <div className="text-[#e0e0e0] break-words">{message}</div>

          {/* Image */}
          {image && (
            <div className="mt-2">
              <img
                src={image}
                alt="Attached"
                className="max-w-md rounded-lg border border-[#04372f]"
                style={{ boxShadow: '0 0 15px rgba(40, 245, 204, 0.1)' }}
              />
            </div>
          )}

          {/* Reactions */}
          {reactions.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {reactions.map((reaction, idx) => (
                <button
                  key={idx}
                  className="px-2 py-1 rounded-full glassmorphism hover:border-[#28f5cc] transition-all duration-200 text-sm flex items-center gap-1.5"
                  style={{
                    boxShadow: '0 0 10px rgba(40, 245, 204, 0.1)',
                  }}
                  onClick={() => onReact?.(id, reaction.emoji)}
                >
                  <span>{reaction.emoji}</span>
                  <span className="text-[#28f5cc]">{reaction.count}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Action Menu */}
        {isHovered && (
          <div className="absolute top-2 right-4 flex gap-2">
            <button
              className="p-2 rounded-lg glassmorphism hover:border-[#28f5cc] transition-all duration-200"
              style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.2)' }}
              onClick={() => onReply?.(id)}
            >
              <Reply className="w-4 h-4 text-[#28f5cc]" />
            </button>
            <button
              className="p-2 rounded-lg glassmorphism hover:border-[#28f5cc] transition-all duration-200"
              style={{ boxShadow: '0 0 10px rgba(40, 245, 204, 0.2)' }}
              onClick={() => onReact?.(id, '👍')}
            >
              <Smile className="w-4 h-4 text-[#28f5cc]" />
            </button>
            {isCurrentUser && (
              <button
                className="p-2 rounded-lg glassmorphism hover:border-red-500 transition-all duration-200"
                style={{ boxShadow: '0 0 10px rgba(255, 100, 100, 0.2)' }}
                onClick={() => onDelete?.(id)}
              >
                <Trash2 className="w-4 h-4 text-red-400" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
