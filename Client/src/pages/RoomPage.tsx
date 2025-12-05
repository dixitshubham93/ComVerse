import { useState } from 'react';
import { ArrowLeft, Send, Smile, Paperclip, Phone, PhoneOff } from 'lucide-react';
import { UserSpaceBackground } from '../components/UserSpaceBackground';

interface RoomPageProps {
  room: {
    id: string;
    name: string;
    description: string;
    type: 'voice' | 'memes' | 'general' | 'announcements';
    activeUsers: number;
  };
  communityName: string;
  onBack: () => void;
}

const mockMessages = [
  {
    id: '1',
    user: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    message: 'Hey everyone! Just joined this room 👋',
    timestamp: '10:23 AM',
  },
  {
    id: '2',
    user: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    message: 'Welcome! Great to have you here',
    timestamp: '10:24 AM',
  },
  {
    id: '3',
    user: 'Mike Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    message: 'Anyone want to discuss the latest tech updates?',
    timestamp: '10:25 AM',
  },
];

const activeParticipants = [
  {
    name: 'Alex Rivera',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
    isOnline: true,
  },
  {
    name: 'Sarah Chen',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
    isOnline: true,
  },
  {
    name: 'Mike Johnson',
    avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100&h=100&fit=crop',
    isOnline: true,
  },
  {
    name: 'Emma Davis',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop',
    isOnline: false,
  },
];

export function RoomPage({ room, communityName, onBack }: RoomPageProps) {
  const [message, setMessage] = useState('');
  const [isInVoice, setIsInVoice] = useState(false);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle send message
      setMessage('');
    }
  };

  return (
    <div className="relative h-screen w-full overflow-hidden flex">
      {/* Background */}
      <UserSpaceBackground />

      {/* Main Content */}
      <div className="relative z-10 flex-1 flex flex-col">
        {/* Room Header */}
        <div
          className="h-16 px-6 flex items-center gap-4 border-b"
          style={{
            background: 'rgba(4, 55, 47, 0.3)',
            backdropFilter: 'blur(12px)',
            borderBottom: '1px solid rgba(40, 245, 204, 0.2)',
          }}
        >
          <button
            onClick={onBack}
            className="p-2 rounded-lg hover:bg-[rgba(40,245,204,0.1)] transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-[#28f5cc]" />
          </button>

          <div className="flex-1">
            <h2 className="text-white">{room.name}</h2>
            <p className="text-[#747c88] text-sm">{communityName}</p>
          </div>

          {room.type === 'voice' && (
            <button
              onClick={() => setIsInVoice(!isInVoice)}
              className="flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-200"
              style={{
                background: isInVoice ? 'rgba(255, 100, 100, 0.2)' : 'rgba(40, 245, 204, 0.2)',
                border: isInVoice
                  ? '1px solid rgba(255, 100, 100, 0.4)'
                  : '1px solid rgba(40, 245, 204, 0.4)',
                color: isInVoice ? '#ff6464' : '#28f5cc',
              }}
            >
              {isInVoice ? <PhoneOff className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
              <span className="text-sm">{isInVoice ? 'Leave Voice' : 'Join Voice'}</span>
            </button>
          )}
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {mockMessages.map((msg) => (
            <div key={msg.id} className="flex gap-3">
              <img
                src={msg.avatar}
                alt={msg.user}
                className="w-10 h-10 rounded-full flex-shrink-0"
                style={{ border: '2px solid rgba(40, 245, 204, 0.3)' }}
              />
              <div className="flex-1">
                <div className="flex items-baseline gap-2 mb-1">
                  <span className="text-white">{msg.user}</span>
                  <span className="text-[#747c88] text-xs">{msg.timestamp}</span>
                </div>
                <p className="text-white">{msg.message}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Message Input */}
        <div
          className="p-4 border-t"
          style={{
            background: 'rgba(4, 55, 47, 0.3)',
            backdropFilter: 'blur(12px)',
            borderTop: '1px solid rgba(40, 245, 204, 0.2)',
          }}
        >
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-[rgba(40,245,204,0.1)] transition-colors">
              <Paperclip className="w-5 h-5 text-[#747c88] hover:text-[#28f5cc]" />
            </button>

            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Type a message..."
              className="flex-1 px-4 py-2 rounded-lg bg-black/30 border border-[rgba(40,245,204,0.2)] text-white placeholder-[#747c88] focus:border-[#28f5cc] focus:outline-none"
            />

            <button className="p-2 rounded-lg hover:bg-[rgba(40,245,204,0.1)] transition-colors">
              <Smile className="w-5 h-5 text-[#747c88] hover:text-[#28f5cc]" />
            </button>

            <button
              onClick={handleSendMessage}
              className="p-2 rounded-lg transition-all duration-200"
              style={{
                background: 'rgba(40, 245, 204, 0.2)',
                border: '1px solid rgba(40, 245, 204, 0.4)',
              }}
            >
              <Send className="w-5 h-5 text-[#28f5cc]" />
            </button>
          </div>
        </div>
      </div>

      {/* Participants Sidebar */}
      <div
        className="relative z-10 w-64 border-l overflow-y-auto"
        style={{
          background: 'rgba(4, 55, 47, 0.2)',
          backdropFilter: 'blur(12px)',
          borderLeft: '1px solid rgba(40, 245, 204, 0.2)',
        }}
      >
        <div className="p-4 border-b" style={{ borderBottom: '1px solid rgba(40, 245, 204, 0.1)' }}>
          <h3 className="text-white mb-1">Participants</h3>
          <p className="text-[#747c88] text-sm">{room.activeUsers} active</p>
        </div>

        <div className="p-4 space-y-2">
          {activeParticipants.map((participant, index) => (
            <div
              key={index}
              className="flex items-center gap-3 p-2 rounded-lg hover:bg-[rgba(40,245,204,0.05)] transition-colors"
            >
              <div className="relative">
                <img
                  src={participant.avatar}
                  alt={participant.name}
                  className="w-8 h-8 rounded-full"
                  style={{ border: '1.5px solid rgba(40, 245, 204, 0.3)' }}
                />
                {participant.isOnline && (
                  <div
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#04372f]"
                    style={{
                      background: '#28f5cc',
                      boxShadow: '0 0 6px rgba(40, 245, 204, 0.6)',
                    }}
                  />
                )}
              </div>
              <span className="text-white text-sm flex-1 truncate">{participant.name}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
