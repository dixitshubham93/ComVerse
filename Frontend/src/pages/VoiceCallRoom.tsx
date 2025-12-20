import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2, Hash } from 'lucide-react';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { useRoomSocket, UserDto } from '../hooks/useRoomSocket';
import { getVoiceRoomMetadata, VoiceRoomMetadata } from '../api/messageApi';
import { useAuth } from '../contexts/AuthContext';
import Peer from 'simple-peer';

interface VoiceUser {
  id: string;
  name: string;
  avatar: string;
  isTalking: boolean;
  isMuted: boolean;
  isOnline: boolean;
  userId: number;
}

interface VoiceRoom {
  id: string;
  name: string;
  activeUsers: number;
}

interface VoiceCallRoomProps {
  roomName: string;
  roomId: number;
  communityId: number;
  communityName: string;
  communityAvatar?: string;
  userRole: 'Owner' | 'Admin' | 'Member';
  onBack: () => void;
  onGoToHome?: () => void;
  onGoToUserSpace?: () => void;
}

const currentUserMock = {
  name: 'Alex Rivera',
  avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100&h=100&fit=crop',
};

const MOCK_USERS: VoiceUser[] = [
  { id: '1', name: 'Sarah Wilson', avatar: '👩‍💼', isTalking: false, isMuted: false, isOnline: true, userId: 101 },
  { id: '2', name: 'James Chen', avatar: '👨‍💻', isTalking: false, isMuted: false, isOnline: true, userId: 102 },
  { id: '3', name: 'Elena Rodriguez', avatar: '👩‍🎨', isTalking: false, isMuted: false, isOnline: true, userId: 103 },
  { id: '4', name: 'Marcus Thorne', avatar: '👨‍🚀', isTalking: false, isMuted: false, isOnline: true, userId: 104 },
];

export function VoiceCallRoom({ 
  roomName: initialRoomName,
  roomId,
  communityId,
  communityName, 
  communityAvatar = 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=100&h=100&fit=crop',
  userRole,
  onBack,
  onGoToHome,
  onGoToUserSpace,
}: VoiceCallRoomProps) {
  const { user } = useAuth();
    const currentUser = {
      name: user?.username || 'Guest',
      avatar: user?.avatarUrl || user?.username?.charAt(0).toUpperCase() || 'G',
    };


  const [users, setUsers] = useState<VoiceUser[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  
  const voiceRooms: VoiceRoom[] = [
    { id: '1', name: initialRoomName, activeUsers: users.length },
    { id: '2', name: 'Gaming Zone', activeUsers: 0 },
    { id: '3', name: 'Music Lounge', activeUsers: 0 },
  ];
  const [currentRoomName, setCurrentRoomName] = useState(initialRoomName);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<number, Peer.Instance>>(new Map());
  const audioElementsRef = useRef<Map<number, HTMLAudioElement>>(new Map());

  // WebSocket connection for presence and signaling
  const { isConnected, joinVoice, leaveVoice, sendSignal } = useRoomSocket(roomId, communityId, {
    onPresence: (presenceUsers: UserDto[]) => {
      const convertedUsers = presenceUsers.map(convertUserDto);
      setUsers(convertedUsers);
      
      // If we are in call, we might need to connect to new users
      // or cleanup old users. This is also handled by the useEffect below.
    },
    onSignal: (data) => {
      console.log('Received signal from:', data.from);
      const peer = peersRef.current.get(data.from);
      if (peer) {
        peer.signal(data.signal);
      } else if (isInCall) {
        console.log('Creating non-initiator peer for:', data.from);
        const newPeer = createPeer(data.from, false);
        newPeer.signal(data.signal);
      }
    }
  });

  const createPeer = (targetUserId: number, initiator: boolean) => {
    console.log(`Creating peer for ${targetUserId}, initiator: ${initiator}`);
    if (peersRef.current.has(targetUserId)) {
      console.log(`Peer for ${targetUserId} already exists, destroying old one`);
      peersRef.current.get(targetUserId)?.destroy();
    }

    const peer = new Peer({
      initiator,
      trickle: false,
      stream: localStreamRef.current || undefined,
    });

    peer.on('signal', (signal) => {
      sendSignal(targetUserId, signal);
    });

    peer.on('stream', (stream) => {
      console.log(`Received stream from ${targetUserId}`);
      let audio = audioElementsRef.current.get(targetUserId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        document.body.appendChild(audio); // Ensure it's in DOM for some browsers
        audioElementsRef.current.set(targetUserId, audio);
      }
      audio.srcObject = stream;
      audio.volume = volume / 100;
    });

    peer.on('error', (err) => {
      console.error(`Peer error with ${targetUserId}:`, err);
      peer.destroy();
      peersRef.current.delete(targetUserId);
    });

    peer.on('close', () => {
      console.log(`Peer connection with ${targetUserId} closed`);
      const audio = audioElementsRef.current.get(targetUserId);
      if (audio) {
        audio.srcObject = null;
        audio.remove();
        audioElementsRef.current.delete(targetUserId);
      }
      peersRef.current.delete(targetUserId);
    });

    peersRef.current.set(targetUserId, peer);
    return peer;
  };

  useEffect(() => {
    if (isInCall) {
      // Connect to any user that is currently in the room but not connected
      users.forEach(u => {
        const targetId = Number(u.userId);
        if (targetId !== user?.id && !peersRef.current.has(targetId)) {
          createPeer(targetId, true);
        }
      });

      // Cleanup peers for users no longer in presence
      const presenceIds = new Set(users.map(u => Number(u.userId)));
      peersRef.current.forEach((peer, userId) => {
        if (!presenceIds.has(userId)) {
          console.log(`Cleaning up peer for ${userId} as they are no longer in presence`);
          peer.destroy();
        }
      });
    }
  }, [isInCall, users, user?.id]);

  const convertUserDto = (dto: UserDto): VoiceUser => {
    return {
      id: dto.id.toString(),
      name: dto.username,
      avatar: dto.avatarUrl || dto.username.charAt(0).toUpperCase(),
      isTalking: false,
      isMuted: false,
      isOnline: true,
      userId: dto.id,
    };
  };

  const renderAvatar = (user: VoiceUser | { name: string, avatar: string }, size: string = 'w-28 h-28', textSize: string = 'text-4xl') => {
    const isUrl = user.avatar.startsWith('http') || user.avatar.startsWith('/');
    
    return (
      <div
        className={`relative ${size} rounded-full flex items-center justify-center ${!isUrl ? textSize : ''} transition-all duration-300 group-hover:scale-110 overflow-hidden`}
        style={{
          background: (user as any).isTalking
            ? 'linear-gradient(135deg, rgba(40, 245, 204, 0.3), rgba(4, 173, 123, 0.3))'
            : 'linear-gradient(135deg, rgba(40, 245, 204, 0.15), rgba(4, 55, 47, 0.4))',
          border: `2px solid ${(user as any).isTalking ? '#28f5cc' : 'rgba(40, 245, 204, 0.3)'}`,
          boxShadow: (user as any).isTalking
            ? '0 0 30px rgba(40, 245, 204, 0.5), inset 0 0 20px rgba(40, 245, 204, 0.2)'
            : '0 0 15px rgba(40, 245, 204, 0.2)',
        }}
      >
        {isUrl ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-bold">{user.avatar}</span>
        )}

        {/* Online Indicator */}
        {(user as any).isOnline && (
          <div
            className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-2"
            style={{
              background: '#04ad7b',
              borderColor: 'rgba(0, 0, 0, 0.8)',
              boxShadow: '0 0 12px #04ad7b',
            }}
          />
        )}

        {/* Muted Indicator */}
        {(user as any).isMuted && (
          <div
            className="absolute bottom-1 left-1 w-7 h-7 rounded-full flex items-center justify-center border-2"
            style={{
              background: 'rgba(220, 38, 38, 0.9)',
              borderColor: 'rgba(0, 0, 0, 0.8)',
              boxShadow: '0 0 12px rgba(220, 38, 38, 0.6)',
            }}
          >
            <MicOff className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setIsLoadingMetadata(true);
        const metadata: VoiceRoomMetadata = await getVoiceRoomMetadata(roomId);
        if (metadata.users.length > 0) {
          const convertedUsers = metadata.users.map(convertUserDto);
          setUsers(convertedUsers);
        }
      } catch (error) {
        console.error('Error loading voice room metadata:', error);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    if (roomId) {
      loadMetadata();
    }
  }, [roomId]);

  const handleJoinCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      setIsInCall(true);
      joinVoice();
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const handleLeaveCall = () => {
    try {
      leaveVoice();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
      peersRef.current.forEach(peer => peer.destroy());
      peersRef.current.clear();
      audioElementsRef.current.forEach(audio => audio.remove());
      audioElementsRef.current.clear();
      setIsInCall(false);
      setIsMuted(false);
    } catch (error) {
      console.error('Error leaving voice call:', error);
    }
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  useEffect(() => {
    audioElementsRef.current.forEach(audio => {
      audio.volume = volume / 100;
    });
  }, [volume]);

  useEffect(() => {
    return () => {
      handleLeaveCall();
    };
  }, []);

  const handleRoomSwitch = (room: VoiceRoom) => {
    if (room.name === currentRoomName) return;
    
    // For now, we only have one real room implementation per component instance
    // but we can simulate switching for UI purposes or notify parent to change roomId
    setIsTransitioning(true);
    
    setTimeout(() => {
      setCurrentRoomName(room.name);
      setIsTransitioning(false);
    }, 350);
  };

  const handleNavigate = (page: string) => {
    if (page === 'home') {
      onBack();
    }
    // Add other navigation logic as needed
  };

  return (
    <div 
      className="min-h-screen w-full overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #000000 0%, #0a0615 50%, #000000 100%)',
        animation: 'page-enter 0.35s ease-out',
      }}
    >
      {/* Background */}
      <UserSpaceBackground />

      {/* Animated Background - Aurora Nebula */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Aurora waves */}
        <div
          className="absolute top-0 left-0 w-full h-full opacity-20"
          style={{
            background: `
              radial-gradient(ellipse at 20% 30%, rgba(40, 245, 204, 0.3) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 70%, rgba(138, 43, 226, 0.25) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(4, 173, 123, 0.2) 0%, transparent 50%)
            `,
            animation: 'aurora-drift 15s ease-in-out infinite',
          }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0">
          {[...Array(30)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${Math.random() * 3 + 1}px`,
                height: `${Math.random() * 3 + 1}px`,
                background: i % 3 === 0 ? '#28f5cc' : i % 3 === 1 ? '#04ad7b' : '#8a2be2',
                boxShadow: `0 0 ${Math.random() * 10 + 5}px currentColor`,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `float-particle ${Math.random() * 20 + 15}s linear infinite`,
                animationDelay: `${Math.random() * 5}s`,
                opacity: 0.6,
              }}
            />
          ))}
        </div>

        {/* Starfield */}
        <div className="absolute inset-0 opacity-40">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute rounded-full bg-white"
              style={{
                width: '1px',
                height: '1px',
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                boxShadow: '0 0 2px rgba(255, 255, 255, 0.8)',
                animation: `twinkle ${Math.random() * 3 + 2}s ease-in-out infinite`,
                animationDelay: `${Math.random() * 3}s`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Left Sidebar */}
      <CommunitySidebar
        communityName={communityName}
        communityAvatar={communityAvatar}
        userRole={userRole}
        currentUser={currentUser}
        onNavigate={handleNavigate}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
      />

      {/* Main Content Container - with sidebar offset */}
      <div className="relative z-10 flex h-screen" style={{ marginLeft: '64px' }}>
        {/* Main Voice Room Area */}
        <div className="flex-1 flex flex-col">
          {/* Header - Premium Design */}
          <div
            className="px-8 py-5 border-b"
            style={{
              background: 'linear-gradient(180deg, rgba(4, 55, 47, 0.4) 0%, rgba(4, 55, 47, 0.25) 100%)',
              backdropFilter: 'blur(24px)',
              borderColor: 'rgba(40, 245, 204, 0.12)',
            }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                {/* Icon Badge */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{
                    background: 'linear-gradient(135deg, rgba(40, 245, 204, 0.2), rgba(4, 173, 123, 0.15))',
                    border: '1px solid rgba(40, 245, 204, 0.25)',
                    boxShadow: '0 4px 12px rgba(40, 245, 204, 0.15)',
                  }}
                >
                  <Volume2 className="w-5 h-5 text-[#28f5cc]" />
                </div>

                {/* Room Info */}
                <div>
                  <h1 
                    className="text-white font-semibold mb-0.5"
                    style={{
                      fontSize: '1.125rem',
                      letterSpacing: '-0.01em',
                      lineHeight: '1.4',
                    }}
                  >
                    {currentRoomName}
                  </h1>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-1.5 h-1.5 rounded-full"
                      style={{
                        background: '#04ad7b',
                        boxShadow: '0 0 6px rgba(4, 173, 123, 0.6)',
                      }}
                    />
                    <p className="text-[#9aa0aa] text-xs font-medium tracking-wide uppercase" style={{ fontSize: '0.6875rem', letterSpacing: '0.05em' }}>
                      Voice Channel
                    </p>
                  </div>
                </div>
              </div>

                {/* User Count Badge - Refined */}
                <div
                  className="px-3.5 py-2 rounded-lg flex items-center gap-2.5"
                  style={{
                    background: 'rgba(4, 55, 47, 0.5)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(40, 245, 204, 0.2)',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                  }}
                >
                  <div className="flex -space-x-2">
                    {users.slice(0, 3).map((u, i) => (
                      <div key={u.id} className="relative transition-transform duration-200 hover:scale-110" style={{ zIndex: 3 - i }}>
                        {renderAvatar(u, 'w-7 h-7', 'text-[10px]')}
                      </div>
                    ))}
                    {isInCall && !users.find(u => Number(u.userId) === user?.id) && (
                      <div className="relative transition-transform duration-200 hover:scale-110" style={{ zIndex: 0 }}>
                        {renderAvatar(currentUser, 'w-7 h-7', 'text-[10px]')}
                      </div>
                    )}
                  </div>
                  <div className="h-4 w-px bg-[rgba(40,245,204,0.2)]" />
                  <span className="text-[#28f5cc] text-xs font-medium" style={{ fontSize: '0.75rem' }}>
                    {(users.find(u => Number(u.userId) === user?.id) ? users.length : (isInCall ? users.length + 1 : users.length))} <span className="text-[#9aa0aa] font-normal">active</span>
                  </span>
                </div>

            </div>
          </div>

            {/* Voice Users Grid */}
            <div 
              className="flex-1 flex items-center justify-center p-12 overflow-y-auto transition-opacity duration-350"
              style={{
                opacity: isTransitioning ? 0.5 : 1,
              }}
            >
              {isLoadingMetadata ? (
                <div className="flex items-center justify-center">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-[#28f5cc]"></div>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl w-full">
                  {users.length === 0 && !isInCall ? (
                    <div className="col-span-full text-center text-[#747c88]">
                      No users in voice channel
                    </div>
                  ) : (
                    <>
                      {/* Current User in Grid */}
                      {isInCall && !users.find(u => Number(u.userId) === user?.id) && (
                        <div
                          className="flex flex-col items-center gap-3 group transition-all duration-300"
                          style={{ animation: 'fade-scale-in 0.4s ease-out' }}
                        >
                          <div className="relative">
                            <div
                              className="absolute inset-0 rounded-full blur-xl transition-all duration-300"
                              style={{
                                background: 'radial-gradient(circle, rgba(40, 245, 204, 0.15) 0%, transparent 70%)',
                              }}
                            />
                            {renderAvatar({ ...currentUser, isTalking: false, isMuted, isOnline: true } as any)}
                          </div>
                          <div
                            className="px-3.5 py-2 rounded-lg text-center transition-all duration-200"
                            style={{
                              background: 'rgba(4, 55, 47, 0.5)',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid rgba(40, 245, 204, 0.3)',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                            }}
                          >
                            <span className="text-[#28f5cc] text-sm font-semibold" style={{ fontSize: '0.8125rem', letterSpacing: '-0.01em' }}>
                              {currentUser.name} (You)
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Other Users in Grid */}
                      {users.map((u) => (
                        <div
                          key={u.id}
                          className="flex flex-col items-center gap-3 group transition-all duration-300"
                          style={{ animation: 'fade-scale-in 0.4s ease-out' }}
                        >
                          <div className="relative">
                            <div
                              className="absolute inset-0 rounded-full blur-xl transition-all duration-300"
                              style={{
                                background: u.isTalking
                                  ? 'radial-gradient(circle, rgba(40, 245, 204, 0.4) 0%, transparent 70%)'
                                  : 'radial-gradient(circle, rgba(40, 245, 204, 0.15) 0%, transparent 70%)',
                                transform: u.isTalking ? 'scale(1.3)' : 'scale(1)',
                              }}
                            />
                            {u.isTalking && (
                              <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                  border: '3px solid #28f5cc',
                                  boxShadow: '0 0 20px rgba(40, 245, 204, 0.6), inset 0 0 20px rgba(40, 245, 204, 0.3)',
                                  animation: 'pulse-ring 1.5s ease-in-out infinite',
                                  transform: 'scale(1.15)',
                                }}
                              />
                            )}
                            {renderAvatar(u)}
                          </div>
                          <div
                            className="px-3.5 py-2 rounded-lg text-center transition-all duration-200"
                            style={{
                              background: 'rgba(4, 55, 47, 0.5)',
                              backdropFilter: 'blur(12px)',
                              border: '1px solid rgba(40, 245, 204, 0.15)',
                              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.2)',
                            }}
                          >
                            <span className="text-white text-sm font-medium" style={{ fontSize: '0.8125rem', letterSpacing: '-0.01em' }}>
                              {u.name} {Number(u.userId) === user?.id ? '(You)' : ''}
                            </span>
                          </div>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>


          {/* Control Bar - Floating at Bottom */}
          <div className="p-6 flex justify-center">
            <div
              className="px-6 py-3.5 rounded-xl flex items-center gap-5 transition-all duration-300"
              style={{
                background: 'linear-gradient(180deg, rgba(4, 55, 47, 0.8) 0%, rgba(4, 55, 47, 0.6) 100%)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(40, 245, 204, 0.25)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(40, 245, 204, 0.1) inset',
              }}
            >
              {!isInCall ? (
                /* Join Call Button */
                <button
                  onClick={handleJoinCall}
                  className="px-6 py-3 rounded-lg flex items-center gap-2.5 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                  style={{
                    background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)',
                    boxShadow: '0 4px 16px rgba(40, 245, 204, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1) inset',
                    animation: 'pulse-glow 2s ease-in-out infinite',
                  }}
                >
                  <Phone className="w-4.5 h-4.5 text-black" />
                  <span className="text-black font-semibold text-sm" style={{ fontSize: '0.875rem' }}>Join Call</span>
                </button>
              ) : (
                <>
                  {/* Mute Toggle */}
                  <button
                    onClick={toggleMute}
                    className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: isMuted
                        ? 'linear-gradient(135deg, rgba(220, 38, 38, 0.9), rgba(185, 28, 28, 0.9))'
                        : 'rgba(40, 245, 204, 0.15)',
                      border: `1px solid ${isMuted ? 'rgba(220, 38, 38, 0.5)' : 'rgba(40, 245, 204, 0.3)'}`,
                      boxShadow: isMuted
                        ? '0 4px 12px rgba(220, 38, 38, 0.4)'
                        : '0 4px 12px rgba(40, 245, 204, 0.2)',
                    }}
                    title={isMuted ? 'Unmute' : 'Mute'}
                  >
                    {isMuted ? (
                      <MicOff className="w-5 h-5 text-white" />
                    ) : (
                      <Mic className="w-5 h-5 text-[#28f5cc]" />
                    )}
                  </button>

                  {/* Volume Control */}
                  <div className="flex items-center gap-3 px-4">
                    <Volume2 className="w-4 h-4 text-[#28f5cc]" />
                    <div className="relative w-28 h-1.5 rounded-full overflow-hidden"
                      style={{
                        background: 'rgba(116, 124, 136, 0.25)',
                      }}
                    >
                      <div
                        className="absolute left-0 top-0 h-full rounded-full transition-all duration-200"
                        style={{
                          width: `${volume}%`,
                          background: 'linear-gradient(90deg, #04ad7b 0%, #28f5cc 100%)',
                          boxShadow: '0 0 8px rgba(40, 245, 204, 0.4)',
                        }}
                      />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      />
                    </div>
                    <span className="text-[#28f5cc] text-xs font-medium w-7" style={{ fontSize: '0.75rem' }}>{volume}%</span>
                  </div>

                  {/* Leave Call Button */}
                  <button
                    onClick={handleLeaveCall}
                    className="w-12 h-12 rounded-lg flex items-center justify-center transition-all duration-200 hover:scale-105 active:scale-95"
                    style={{
                      background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.9), rgba(185, 28, 28, 0.9))',
                      border: '1px solid rgba(220, 38, 38, 0.5)',
                      boxShadow: '0 4px 12px rgba(220, 38, 38, 0.4)',
                    }}
                    title="Leave Call"
                  >
                    <PhoneOff className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Right Side Panel - Voice Room List */}
        <div
          className="w-72 h-full p-5 border-l flex flex-col"
          style={{
            background: 'linear-gradient(180deg, rgba(4, 55, 47, 0.3) 0%, rgba(4, 55, 47, 0.2) 100%)',
            backdropFilter: 'blur(24px)',
            borderColor: 'rgba(40, 245, 204, 0.12)',
          }}
        >
          {/* Community Header */}
          <div className="mb-6 pb-5 border-b" style={{ borderColor: 'rgba(40, 245, 204, 0.1)' }}>
            <h3 className="text-[#9aa0aa] text-xs uppercase tracking-wider mb-2 font-medium" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>
              Community
            </h3>
            <h2 className="text-white font-semibold text-base" style={{ letterSpacing: '-0.01em' }}>
              {communityName}
            </h2>
          </div>

          {/* Current Room Indicator */}
          <div className="mb-5">
            <h3 className="text-[#9aa0aa] text-xs uppercase tracking-wider mb-3 font-medium" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>
              Voice Channels
            </h3>
            
            {/* Voice Rooms List */}
            <div className="space-y-1.5">
              {voiceRooms.map(room => {
                const isActive = room.name === currentRoomName;
                return (
                  <div
                    key={room.id}
                    className="px-3 py-2.5 rounded-lg transition-all duration-200 cursor-pointer group"
                    style={{
                      background: isActive 
                        ? 'linear-gradient(135deg, rgba(40, 245, 204, 0.12), rgba(4, 173, 123, 0.08))' 
                        : 'rgba(42, 52, 68, 0.2)',
                      border: isActive 
                        ? '1px solid rgba(40, 245, 204, 0.3)' 
                        : '1px solid rgba(40, 245, 204, 0.08)',
                      boxShadow: isActive 
                        ? '0 2px 8px rgba(40, 245, 204, 0.15), inset 0 1px 0 rgba(40, 245, 204, 0.1)' 
                        : 'none',
                    }}
                    onClick={() => handleRoomSwitch(room)}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(40, 245, 204, 0.06)';
                        e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.15)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.background = 'rgba(42, 52, 68, 0.2)';
                        e.currentTarget.style.borderColor = 'rgba(40, 245, 204, 0.08)';
                      }
                    }}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2.5">
                        <Volume2 className={`w-3.5 h-3.5 ${isActive ? 'text-[#28f5cc]' : 'text-[#747c88]'} transition-colors duration-200`} />
                        <span className={`text-sm font-medium ${isActive ? 'text-white' : 'text-[#9aa0aa]'} transition-colors duration-200`} style={{ fontSize: '0.8125rem' }}>
                          {room.name}
                        </span>
                      </div>
                    </div>
                    {isActive && (
                      <div className="flex items-center gap-1.5 ml-5">
                        <div
                          className="w-1.5 h-1.5 rounded-full"
                          style={{
                            background: '#04ad7b',
                            boxShadow: '0 0 6px rgba(4, 173, 123, 0.6)',
                            animation: 'pulse 2s ease-in-out infinite',
                          }}
                        />
                        <span className="text-[#04ad7b] text-xs font-medium" style={{ fontSize: '0.6875rem' }}>
                          {room.activeUsers} active
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Text Channels Preview */}
          <div className="mt-auto pt-5 border-t" style={{ borderColor: 'rgba(40, 245, 204, 0.1)' }}>
            <h3 className="text-[#9aa0aa] text-xs uppercase tracking-wider mb-3 font-medium" style={{ fontSize: '0.6875rem', letterSpacing: '0.1em' }}>
              Text Channels
            </h3>
            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg cursor-pointer transition-all duration-200 hover:bg-[rgba(40,245,204,0.06)] group">
              <Hash className="w-3.5 h-3.5 text-[#747c88] group-hover:text-[#9aa0aa] transition-colors duration-200" />
              <span className="text-[#9aa0aa] text-sm font-medium group-hover:text-white transition-colors duration-200" style={{ fontSize: '0.8125rem' }}>
                general
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* CSS Animations */}
      <style>{`
        @keyframes aurora-drift {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(5%, 5%) scale(1.05); }
          66% { transform: translate(-5%, 3%) scale(0.95); }
        }

        @keyframes float-particle {
          0% { transform: translateY(100vh) translateX(0); opacity: 0; }
          10% { opacity: 0.6; }
          90% { opacity: 0.6; }
          100% { transform: translateY(-10vh) translateX(20px); opacity: 0; }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes pulse-ring {
          0%, 100% { transform: scale(1.15); opacity: 1; }
          50% { transform: scale(1.25); opacity: 0.7; }
        }

        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 30px rgba(40, 245, 204, 0.5); }
          50% { box-shadow: 0 0 45px rgba(40, 245, 204, 0.8); }
        }

        @keyframes fade-scale-in {
          from {
            opacity: 0;
            transform: scale(0.9);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }

        @keyframes page-enter {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
