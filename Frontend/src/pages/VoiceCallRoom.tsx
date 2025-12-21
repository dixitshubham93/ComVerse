import { useState, useEffect, useRef, useCallback } from 'react';
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

export function VoiceCallRoom({ 
  roomName: initialRoomName,
  roomId: initialRoomId,
  communityId,
  communityName, 
  userRole,
  onBack,
  onGoToHome,
  onGoToUserSpace,
}: VoiceCallRoomProps) {
  const { user } = useAuth();
  const currentUser = {
    name: user?.username || 'Guest',
    avatar: user?.avatar || user?.username?.charAt(0).toUpperCase() || 'G',
  };

  const [users, setUsers] = useState<VoiceUser[]>([]);
  const [isInCall, setIsInCall] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  
  const [currentRoomId, setCurrentRoomId] = useState(initialRoomId);
  const [currentRoomName, setCurrentRoomName] = useState(initialRoomName);
  const [voiceRooms] = useState<VoiceRoom[]>([]); // Assuming this will be fetched
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  // Refs for WebRTC management
  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<number, Peer.Instance>>(new Map());
  const audioElementsRef = useRef<Map<number, HTMLAudioElement>>(new Map());
  const presenceRef = useRef<UserDto[]>([]);
  const audioContainerRef = useRef<HTMLDivElement>(null);

  const convertUserDto = useCallback((dto: UserDto): VoiceUser => {
    return {
      id: dto.id.toString(),
      name: dto.username,
      avatar: dto.avatarUrl || dto.username.charAt(0).toUpperCase(),
      isTalking: false,
      isMuted: false,
      isOnline: true,
      userId: dto.id,
    };
  }, []);

  const destroyPeer = useCallback((userId: number) => {
    console.log(`[VC] Destroying peer for user ${userId}`);
    const peer = peersRef.current.get(userId);
    if (peer) {
      peer.destroy();
      peersRef.current.delete(userId);
    }
    const audio = audioElementsRef.current.get(userId);
    if (audio) {
      audio.srcObject = null;
      audio.remove();
      audioElementsRef.current.delete(userId);
    }
  }, []);

  const { isConnected, isConnecting, joinVoice, leaveVoice, sendSignal, error: socketError } = useRoomSocket(currentRoomId, communityId, {
    onPresence: (newPresence: UserDto[]) => {
      console.log('[VC] Presence updated:', newPresence.map(u => u.username));
      
      const currentUserId = Number(user?.id);
      
      if (isInCall) {
        const prevIds = new Set(presenceRef.current.map(u => u.id));
        const newIds = new Set(newPresence.map(u => u.id));

        // 1. Identify users who just joined (Requirement 2: Existing users initiate)
        // If presenceRef.current was empty, it means we just joined, so we don't initiate to anyone.
        // Existing users in the room will see us join and initiate to us.
        if (presenceRef.current.length > 0) {
          newPresence.forEach(u => {
            if (u.id !== currentUserId && !prevIds.has(u.id)) {
              console.log(`[VC] New user detected: ${u.username} (${u.id}). I am existing user, initiating call.`);
              createPeer(u.id, true);
            }
          });
        }

        // 2. Identify users who left
        presenceRef.current.forEach(u => {
          if (!newIds.has(u.id)) {
            console.log(`[VC] User left: ${u.username} (${u.id}). Cleaning up peer.`);
            destroyPeer(u.id);
          }
        });
      }

      presenceRef.current = newPresence;
      setUsers(newPresence.map(convertUserDto));
    },
    onSignal: (data) => {
      console.log(`[VC] Received signal from ${data.from}, type: ${data.signal.type || 'ice'}`);
      
      let peer = peersRef.current.get(data.from);
      if (peer) {
        peer.signal(data.signal);
      } else if (isInCall) {
        // Requirement 2: Newly joined users -> initiator = false
        // We receive a signal but have no peer, so we are the non-initiator
        console.log(`[VC] No peer for ${data.from} yet. Creating non-initiator peer.`);
        const newPeer = createPeer(data.from, false);
        newPeer.signal(data.signal);
      }
    }
  });

  const createPeer = useCallback((targetUserId: number, initiator: boolean) => {
    console.log(`[VC] Creating peer for ${targetUserId}, role: ${initiator ? 'INITIATOR' : 'RESPONDER'}`);
    
    // Clean up existing peer if any
    if (peersRef.current.has(targetUserId)) {
      destroyPeer(targetUserId);
    }

    const peer = new Peer({
      initiator,
      trickle: false,
      stream: localStreamRef.current || undefined,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] }
    });

    peer.on('signal', (signal) => {
      console.log(`[VC] Generated signal for ${targetUserId}, type: ${signal.type || 'ice'}. Sending...`);
      sendSignal(targetUserId, signal);
    });

    peer.on('stream', (stream) => {
      console.log(`[VC] Received remote stream from ${targetUserId}`);
      
      // Requirement 4: Create audio, append to DOM, volume control
      let audio = audioElementsRef.current.get(targetUserId);
      if (!audio) {
        audio = document.createElement('audio');
        audio.autoplay = true;
        audio.hidden = true;
        if (audioContainerRef.current) {
          audioContainerRef.current.appendChild(audio);
        } else {
          document.body.appendChild(audio);
        }
        audioElementsRef.current.set(targetUserId, audio);
      }
      
      audio.srcObject = stream;
      audio.volume = volume / 100;
      
      // Handle browser autoplay restrictions
      audio.play().catch(err => {
        console.warn(`[VC] Autoplay prevented for user ${targetUserId}. User interaction may be required.`, err);
      });
    });

    peer.on('error', (err) => {
      console.error(`[VC] Peer error with ${targetUserId}:`, err);
      destroyPeer(targetUserId);
    });

    peer.on('close', () => {
      console.log(`[VC] Peer connection with ${targetUserId} closed`);
      destroyPeer(targetUserId);
    });

    peersRef.current.set(targetUserId, peer);
    return peer;
  }, [sendSignal, volume, destroyPeer]);

  const handleJoinCall = async () => {
    // Requirement 1: Request mic permission only when user clicks “Join Call”
    console.log('[VC] Joining call, requesting mic...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      console.log('[VC] Mic access granted');
      
      setIsInCall(true);
      joinVoice();
      
      // We don't initiate here. We wait for onPresence to see existing users.
      // Actually, if we just joined, onPresence will be called with the list.
    } catch (error) {
      console.error('[VC] Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
    }
  };

  const handleLeaveCall = useCallback(() => {
    console.log('[VC] Leaving call, cleaning up...');
    try {
      leaveVoice();
      
      // Requirement 5: Cleanup tracks, peers, audio, maps
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          track.stop();
          console.log(`[VC] Stopped track: ${track.kind}`);
        });
        localStreamRef.current = null;
      }

      peersRef.current.forEach((peer, userId) => {
        peer.destroy();
        console.log(`[VC] Destroyed peer for ${userId}`);
      });
      peersRef.current.clear();

      audioElementsRef.current.forEach((audio, userId) => {
        audio.srcObject = null;
        audio.remove();
        console.log(`[VC] Removed audio element for ${userId}`);
      });
      audioElementsRef.current.clear();

      setIsInCall(false);
      setIsMuted(false);
      presenceRef.current = [];
    } catch (error) {
      console.error('[VC] Error during handleLeaveCall:', error);
    }
  }, [leaveVoice]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        console.log(`[VC] Mic ${audioTrack.enabled ? 'unmuted' : 'muted'}`);
      }
    }
  };

  // Volume control effect
  useEffect(() => {
    audioElementsRef.current.forEach(audio => {
      audio.volume = volume / 100;
    });
  }, [volume]);

  // Load initial metadata
  useEffect(() => {
    const loadMetadata = async () => {
      try {
        setIsLoadingMetadata(true);
        const metadata: VoiceRoomMetadata = await getVoiceRoomMetadata(currentRoomId);
        if (metadata.users.length > 0) {
          setUsers(metadata.users.map(convertUserDto));
        }
      } catch (error) {
        console.error('Error loading voice room metadata:', error);
      } finally {
        setIsLoadingMetadata(false);
      }
    };

    if (currentRoomId) {
      loadMetadata();
    }
  }, [currentRoomId, convertUserDto]);

  // Cleanup on unmount or room switch
  useEffect(() => {
    return () => {
      handleLeaveCall();
    };
  }, [handleLeaveCall, currentRoomId]); // Added currentRoomId to handle room switch cleanup

  const handleRoomSwitch = (room: VoiceRoom) => {
    const newRoomId = parseInt(room.id, 10);
    if (newRoomId === currentRoomId) return;
    
    console.log(`[VC] Switching from room ${currentRoomId} to ${newRoomId}`);
    setIsTransitioning(true);
    setCurrentRoomId(newRoomId);
    setCurrentRoomName(room.name);
    
    setTimeout(() => {
      setIsTransitioning(false);
    }, 350);
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

  return (
    <div 
      className="min-h-screen w-full overflow-hidden relative"
      style={{
        background: 'linear-gradient(180deg, #000000 0%, #0a0615 50%, #000000 100%)',
        animation: 'page-enter 0.35s ease-out',
      }}
    >
      <UserSpaceBackground />
      
      {/* Hidden Audio Container for Requirement 4 */}
      <div ref={audioContainerRef} className="hidden" />

      {/* Aurora Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
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
      </div>

      <CommunitySidebar
        communityId={communityId}
        communityName={communityName}
        userRole={userRole}
        currentUser={currentUser}
        onShowMembers={() => {}}
        onNavigate={(page) => page === 'home' && onBack()}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
      />

      <div className="relative z-10 flex h-screen" style={{ marginLeft: '64px' }}>
        <div className="flex-1 flex flex-col">
          {/* Header */}
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
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center"
                  style={{
                    background: 'linear-gradient(135deg, rgba(40, 245, 204, 0.2), rgba(4, 173, 123, 0.15))',
                    border: '1px solid rgba(40, 245, 204, 0.25)',
                  }}
                >
                  <Volume2 className="w-5 h-5 text-[#28f5cc]" />
                </div>
                <div>
                  <h1 className="text-white font-semibold mb-0.5">{currentRoomName}</h1>
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-[#04ad7b]" />
                    <p className="text-[#9aa0aa] text-xs font-medium tracking-wide uppercase">Voice Channel</p>
                  </div>
                </div>
              </div>

              <div
                className="px-3.5 py-2 rounded-lg flex items-center gap-2.5"
                style={{
                  background: 'rgba(4, 55, 47, 0.5)',
                  border: '1px solid rgba(40, 245, 204, 0.2)',
                }}
              >
                <div className="flex -space-x-2">
                  {users.slice(0, 3).map((u) => (
                    <div key={u.id} className="relative z-10">
                      {renderAvatar(u, 'w-7 h-7', 'text-[10px]')}
                    </div>
                  ))}
                </div>
                <div className="h-4 w-px bg-[rgba(40,245,204,0.2)]" />
                <span className="text-[#28f5cc] text-xs font-medium">
                  {users.length} <span className="text-[#9aa0aa] font-normal">active</span>
                </span>
              </div>
            </div>
          </div>

          {/* Grid */}
          <div className={`flex-1 flex items-center justify-center p-12 overflow-y-auto transition-opacity duration-350 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
            {isLoadingMetadata ? (
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#28f5cc]" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-6xl w-full">
                {users.length === 0 && !isInCall ? (
                  <div className="col-span-full text-center text-[#747c88]">No users in voice channel</div>
                ) : (
                  <>
                    {isInCall && !users.find(u => Number(u.userId) === user?.id) && (
                      <div className="flex flex-col items-center gap-3 animate-fade-in">
                        {renderAvatar({ ...currentUser, isTalking: false, isMuted, isOnline: true } as any)}
                        <div className="px-3.5 py-2 rounded-lg bg-[rgba(4,55,47,0.5)] border border-[#28f5cc] shadow-lg">
                          <span className="text-[#28f5cc] text-sm font-semibold">{currentUser.name} (You)</span>
                        </div>
                      </div>
                    )}
                    {users.map((u) => (
                      <div key={u.id} className="flex flex-col items-center gap-3 animate-fade-in">
                        {renderAvatar(u)}
                        <div className="px-3.5 py-2 rounded-lg bg-[rgba(4,55,47,0.5)] border border-[rgba(40,245,204,0.15)]">
                          <span className="text-white text-sm font-medium">{u.name} {Number(u.userId) === user?.id ? '(You)' : ''}</span>
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="p-6 flex justify-center">
            <div
              className="px-6 py-3.5 rounded-xl flex items-center gap-5"
              style={{
                background: 'rgba(4, 55, 47, 0.8)',
                backdropFilter: 'blur(24px)',
                border: '1px solid rgba(40, 245, 204, 0.25)',
              }}
            >
              {!isInCall ? (
                <button
                  onClick={handleJoinCall}
                  disabled={!isConnected || isConnecting}
                  className={`px-6 py-3 rounded-lg flex items-center gap-2.5 transition-all ${(!isConnected || isConnecting) ? 'opacity-50 cursor-not-allowed' : 'hover:scale-105 active:scale-95'}`}
                  style={{ background: 'linear-gradient(135deg, #04ad7b 0%, #28f5cc 100%)', boxShadow: '0 4px 16px rgba(40, 245, 204, 0.4)' }}
                >
                  <Phone className="w-5 h-5 text-black" />
                  <span className="text-black font-semibold">{isConnecting ? 'Connecting...' : (isConnected ? 'Join Call' : 'Offline')}</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={toggleMute}
                    className="w-12 h-12 rounded-lg flex items-center justify-center transition-all hover:scale-105"
                    style={{
                      background: isMuted ? 'rgba(220, 38, 38, 0.9)' : 'rgba(40, 245, 204, 0.15)',
                      border: `1px solid ${isMuted ? 'rgba(220, 38, 38, 0.5)' : 'rgba(40, 245, 204, 0.3)'}`,
                    }}
                  >
                    {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-[#28f5cc]" />}
                  </button>

                  <div className="flex items-center gap-3 px-4">
                    <Volume2 className="w-4 h-4 text-[#28f5cc]" />
                    <div className="relative w-28 h-1.5 rounded-full bg-[rgba(116,124,136,0.25)]">
                      <div className="absolute h-full rounded-full bg-[#28f5cc]" style={{ width: `${volume}%` }} />
                      <input
                        type="range" min="0" max="100" value={volume}
                        onChange={(e) => setVolume(Number(e.target.value))}
                        className="absolute inset-0 w-full opacity-0 cursor-pointer"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleLeaveCall}
                    className="w-12 h-12 rounded-lg flex items-center justify-center bg-red-600 hover:bg-red-700 transition-all hover:scale-105"
                  >
                    <PhoneOff className="w-5 h-5 text-white" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Room List Panel */}
        <div
          className="w-72 h-full p-5 border-l"
          style={{
            background: 'rgba(4, 55, 47, 0.2)',
            backdropFilter: 'blur(24px)',
            borderColor: 'rgba(40, 245, 204, 0.12)',
          }}
        >
          <div className="mb-6 pb-5 border-b border-[rgba(40,245,204,0.1)]">
            <h3 className="text-[#9aa0aa] text-[10px] uppercase tracking-widest mb-2">Community</h3>
            <h2 className="text-white font-semibold">{communityName}</h2>
          </div>

          <div className="mb-5">
            <h3 className="text-[#9aa0aa] text-[10px] uppercase tracking-widest mb-3">Voice Channels</h3>
            <div className="space-y-1.5">
              {voiceRooms.map(room => {
                const isActive = room.name === currentRoomName;
                return (
                  <div
                    key={room.id}
                    className={`px-3 py-2.5 rounded-lg cursor-pointer transition-all ${isActive ? 'bg-[rgba(40,245,204,0.1)] border border-[#28f5cc]' : 'hover:bg-[rgba(40,245,204,0.05)]'}`}
                    onClick={() => handleRoomSwitch(room)}
                  >
                    <div className="flex items-center gap-2.5">
                      <Volume2 className={`w-3.5 h-3.5 ${isActive ? 'text-[#28f5cc]' : 'text-[#747c88]'}`} />
                      <span className={`text-sm ${isActive ? 'text-white font-medium' : 'text-[#9aa0aa]'}`}>{room.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes aurora-drift {
          0%, 100% { transform: translate(0, 0); }
          50% { transform: translate(5%, 2%); }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
