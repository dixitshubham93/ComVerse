import { useState, useEffect } from 'react';
import { ArrowLeft, Send, Smile, Paperclip, Phone, PhoneOff } from 'lucide-react';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { useRoomSocket } from '../hooks/useRoomSocket';
import { useAuth } from '../contexts/AuthContext';

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

export function RoomPage({ room, communityName, onBack }: RoomPageProps) {
  const [message, setMessage] = useState('');
  const [isInVoice, setIsInVoice] = useState(false);
  const { user } = useAuth();
  
    const roomId = parseInt(room.id, 10);
    const { participants = [], isConnected } = useRoomSocket(roomId, null);

    useEffect(() => {
      console.log('%c[Room Page] MOUNTED - Room:', 'color: #28f5cc; font-weight: bold;', room.name, '(ID:', roomId, ')');
      console.log('[Room Page] Participants:', participants);
    }, [roomId, participants]);

  const handleSendMessage = () => {
    if (message.trim()) {
      // Handle send message
      setMessage('');
    }
  };

  const handleToggleVoice = () => {
    console.log('%c[Room Page] Toggle Voice clicked. Current state:', 'color: #28f5cc; font-weight: bold;', isInVoice);
    setIsInVoice(!isInVoice);
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
            <h2 className="text-white flex items-center gap-2">
              {room.name}
              {isConnected ? (
                <span className="w-2 h-2 rounded-full bg-[#28f5cc] animate-pulse" title="Connected" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-red-500" title="Disconnected" />
              )}
            </h2>
            <p className="text-[#747c88] text-sm">{communityName}</p>
          </div>

          {room.type === 'voice' && (
            <button
              onClick={handleToggleVoice}
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
          <p className="text-[#747c88] text-sm">
            {participants.length} {participants.length === 1 ? 'member' : 'members'} online
          </p>
        </div>

        <div className="p-4 space-y-2">
          {participants.length > 0 ? (
            participants.map((participant) => (
              <div
                key={participant.userId}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[rgba(40,245,204,0.05)] transition-colors"
              >
                <div className="relative">
                  <img
                    src={participant.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.username}`}
                    alt={participant.username}
                    className="w-8 h-8 rounded-full"
                    style={{ border: '1.5px solid rgba(40, 245, 204, 0.3)' }}
                  />
                  <div
                    className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full border-2 border-[#04372f]"
                    style={{
                      background: participant.inCall ? '#ff6464' : '#28f5cc',
                      boxShadow: `0 0 6px ${participant.inCall ? 'rgba(255, 100, 100, 0.6)' : 'rgba(40, 245, 204, 0.6)'}`,
                    }}
                    title={participant.inCall ? 'In Call' : 'Online'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-white text-sm block truncate">{participant.username}</span>
                  {participant.inCall && (
                    <span className="text-[10px] text-red-400">In Call</span>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-4">
              <p className="text-[#747c88] text-xs">No users online</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

