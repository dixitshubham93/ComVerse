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
  const isInCallRef = useRef(false);

  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const volumeRef = useRef(80);
  
  const [currentRoomId, setCurrentRoomId] = useState(initialRoomId);
  const [currentRoomName, setCurrentRoomName] = useState(initialRoomName);
  const [voiceRooms] = useState<VoiceRoom[]>([]);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(true);

  const localStreamRef = useRef<MediaStream | null>(null);
  const peersRef = useRef<Map<number, Peer.Instance>>(new Map());
  const audioElementsRef = useRef<Map<number, HTMLAudioElement>>(new Map());
  const presenceRef = useRef<UserDto[]>([]);
  const audioContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    volumeRef.current = volume;
  }, [volume]);

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
    const peer = peersRef.current.get(userId);
    if (peer) {
      console.log(`[VC] Destroying peer for user ${userId}`);
      peer.destroy();
      peersRef.current.delete(userId);
    }
    const audio = audioElementsRef.current.get(userId);
    if (audio) {
      console.log(`[VC] Removing audio element for user ${userId}`);
      audio.srcObject = null;
      audio.pause();
      audio.remove();
      audioElementsRef.current.delete(userId);
    }
  }, []);

  const createPeer = useCallback((targetUserId: number, initiator: boolean, signalCallback: (sig: any) => void) => {
    if (peersRef.current.has(targetUserId)) {
      console.log(`[VC] Peer already exists for ${targetUserId}, destroying before recreate`);
      destroyPeer(targetUserId);
    }

    console.log(`[VC] Creating peer for ${targetUserId}, initiator: ${initiator}`);
    
    const peer = new Peer({
      initiator,
      trickle: false,
      stream: localStreamRef.current || undefined,
      config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:global.stun.twilio.com:3478' }] }
    });

    peer.on('signal', (signal) => {
      console.log(`[VC] Signal generated for ${targetUserId}, type: ${signal.type}`);
      signalCallback(signal);
    });

    peer.on('stream', (stream) => {
      console.log(`[VC] Remote stream received from ${targetUserId}`);
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
      audio.volume = volumeRef.current / 100;
      audio.play().catch(e => console.warn('[VC] Play blocked:', e));
    });

    peer.on('error', (err) => {
      console.error(`[VC] Peer error [${targetUserId}]:`, err);
      destroyPeer(targetUserId);
    });

    peer.on('close', () => {
      console.log(`[VC] Peer closed [${targetUserId}]`);
      destroyPeer(targetUserId);
    });

    peersRef.current.set(targetUserId, peer);
    return peer;
  }, [destroyPeer]);

  const { isConnected, isConnecting, joinVoice, leaveVoice, sendSignal, sendMute } = useRoomSocket(currentRoomId, communityId, {
    onPresence: (newPresence: UserDto[]) => {
      console.log('[VC] Presence update:', newPresence.map(u => u.username));
      const currentUserId = Number(user?.id);
      
      if (isInCallRef.current) {
        const prevIds = new Set(presenceRef.current.map(u => u.id));
        const newIds = new Set(newPresence.map(u => u.id));

        // Existing users (including us) should initiate to NEW users
        newPresence.forEach(u => {
          if (u.id !== currentUserId && !prevIds.has(u.id)) {
            // If I was already in the call before this update
            const wasIInCallAlready = presenceRef.current.some(p => p.id === currentUserId);
            if (wasIInCallAlready) {
              console.log(`[VC] I am an existing user, initiating to newcomer: ${u.username}`);
              createPeer(u.id, true, (sig) => sendSignal(u.id, sig));
            }
          }
        });

        // Cleanup peers for users who left
        presenceRef.current.forEach(u => {
          if (!newIds.has(u.id) && u.id !== currentUserId) {
            destroyPeer(u.id);
          }
        });
      }

      presenceRef.current = newPresence;
      setUsers(newPresence.map(convertUserDto));
    },
    onSignal: (data) => {
      if (!isInCallRef.current) return;
      console.log(`[VC] Received ${data.signal.type || 'signal'} from ${data.from}`);
      
      let peer = peersRef.current.get(data.from);
      if (!peer) {
        console.log(`[VC] Peer not found for ${data.from}, creating responder`);
        peer = createPeer(data.from, false, (sig) => sendSignal(data.from, sig));
      }
      peer.signal(data.signal);
    },
    onMute: ({ userId, isMuted }) => {
      setUsers(prev => prev.map(u => u.userId === userId ? { ...u, isMuted } : u));
    }
  });

  const handleJoinCall = async () => {
    if (isInCall) return;
    console.log('[VC] Starting join process...');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      localStreamRef.current = stream;
      isInCallRef.current = true;
      setIsInCall(true);
      
      const success = joinVoice();
      if (!success) {
        console.error('[VC] Socket not connected, could not join');
        handleLeaveCall(true);
        return;
      }
      console.log('[VC] Joined successfully');
    } catch (err) {
      console.error('[VC] Media failed:', err);
      alert('Microphone access is required.');
    }
  };

  const handleLeaveCall = useCallback((isManual: boolean = false) => {
    if (!isInCallRef.current && !isManual) return;
    
    console.log('[VC] Cleaning up resources...');
    isInCallRef.current = false;
    setIsInCall(false);
    setIsMuted(false);
    
    try {
      leaveVoice();
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
      }
      peersRef.current.forEach(p => p.destroy());
      peersRef.current.clear();
      audioElementsRef.current.forEach(a => { a.pause(); a.srcObject = null; a.remove(); });
      audioElementsRef.current.clear();
      presenceRef.current = [];
    } catch (e) {
      console.error('[VC] Leave error:', e);
    }
  }, [leaveVoice]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        const newMuted = !track.enabled;
        track.enabled = !track.enabled;
        setIsMuted(!track.enabled);
        sendMute(!track.enabled);
      }
    }
  };

  useEffect(() => {
    audioElementsRef.current.forEach(a => a.volume = volume / 100);
  }, [volume]);

  useEffect(() => {
    const load = async () => {
      try {
        setIsLoadingMetadata(true);
        const meta = await getVoiceRoomMetadata(currentRoomId);
        setUsers(meta.users.map(convertUserDto));
      } catch (e) {
        console.error('[VC] Meta load error:', e);
      } finally {
        setIsLoadingMetadata(false);
      }
    };
    if (currentRoomId) load();
  }, [currentRoomId, convertUserDto]);

  useEffect(() => {
    return () => {
      if (isInCallRef.current) {
        console.log('[VC] Component unmount, leaving call');
        handleLeaveCall();
      }
    };
  }, [handleLeaveCall]);

  const handleRoomSwitch = (room: VoiceRoom) => {
    const nid = parseInt(room.id, 10);
    if (nid === currentRoomId) return;
    
    if (isInCall) {
      handleLeaveCall(true);
    }
    
    setIsTransitioning(true);
    setCurrentRoomId(nid);
    setCurrentRoomName(room.name);
    setTimeout(() => setIsTransitioning(false), 350);
  };

  const renderAvatar = (user: VoiceUser | { name: string, avatar: string }, size: string = 'w-28 h-28', textSize: string = 'text-4xl') => {
    const isUrl = user.avatar.startsWith('http') || user.avatar.startsWith('/');
    const isTalking = (user as VoiceUser).isTalking;
    const isMuted = (user as VoiceUser).isMuted;
    const isOnline = (user as VoiceUser).isOnline;

    return (
      <div
        className={`relative ${size} rounded-full flex items-center justify-center ${!isUrl ? textSize : ''} transition-all duration-300 group-hover:scale-110 overflow-hidden`}
        style={{
          background: isTalking
            ? 'linear-gradient(135deg, rgba(40, 245, 204, 0.3), rgba(4, 173, 123, 0.3))'
            : 'linear-gradient(135deg, rgba(40, 245, 204, 0.15), rgba(4, 55, 47, 0.4))',
          border: `2px solid ${isTalking ? '#28f5cc' : 'rgba(40, 245, 204, 0.3)'}`,
          boxShadow: isTalking
            ? '0 0 30px rgba(40, 245, 204, 0.5), inset 0 0 20px rgba(40, 245, 204, 0.2)'
            : '0 0 15px rgba(40, 245, 204, 0.2)',
        }}
      >
        {isUrl ? (
          <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
        ) : (
          <span className="text-white font-bold">{user.avatar}</span>
        )}
        {isOnline && (
          <div className="absolute bottom-1 right-1 w-5 h-5 rounded-full border-2 bg-[#04ad7b] border-black shadow-[0_0_12px_#04ad7b]" />
        )}
        {isMuted && (
          <div className="absolute bottom-1 left-1 w-7 h-7 rounded-full flex items-center justify-center border-2 bg-red-600 border-black shadow-[0_0_12px_red]">
            <MicOff className="w-4 h-4 text-white" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen w-full overflow-hidden relative bg-black">
      <UserSpaceBackground />
      <div ref={audioContainerRef} className="hidden" />
      <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_50%_50%,rgba(4,173,123,0.2),transparent_70%)]" />

      <CommunitySidebar
        communityId={communityId}
        communityName={communityName}
        userRole={userRole}
        currentUser={currentUser}
        onShowMembers={() => {}}
        onNavigate={(p) => p === 'home' && onBack()}
        onGoToHome={onGoToHome}
        onGoToUserSpace={onGoToUserSpace}
      />

      <div className="relative z-10 flex h-screen ml-16">
        <div className="flex-1 flex flex-col">
          <header className="px-8 py-5 border-b border-[rgba(40,245,204,0.1)] bg-[rgba(4,55,47,0.3)] backdrop-blur-xl flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-[rgba(40,245,204,0.15)] border border-[rgba(40,245,204,0.2)]">
                <Volume2 className="w-5 h-5 text-[#28f5cc]" />
              </div>
              <div>
                <h1 className="text-white font-semibold">{currentRoomName}</h1>
                <div className="flex items-center gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#04ad7b]" />
                  <span className="text-[#9aa0aa] text-[10px] uppercase tracking-wider">Voice Channel</span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[rgba(4,55,47,0.5)] border border-[rgba(40,245,204,0.2)] flex items-center gap-3">
              <span className="text-[#28f5cc] text-sm font-medium">{users.length} Active</span>
            </div>
          </header>

          <main className={`flex-1 flex items-center justify-center p-8 transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
            {isLoadingMetadata ? (
              <div className="w-10 h-10 border-2 border-[#28f5cc] border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-5xl">
                {isInCall && !users.some(u => u.userId === user?.id) && (
                  <div className="flex flex-col items-center gap-3">
                    {renderAvatar({ ...currentUser, isTalking: false, isMuted, isOnline: true } as any)}
                    <span className="text-[#28f5cc] text-xs font-bold px-2 py-1 bg-[rgba(4,55,47,0.5)] rounded border border-[#28f5cc]">{currentUser.name} (You)</span>
                  </div>
                )}
                {users.map(u => (
                  <div key={u.id} className="flex flex-col items-center gap-3">
                    {renderAvatar(u)}
                    <span className="text-white text-xs font-medium">{u.name} {u.userId === user?.id ? '(You)' : ''}</span>
                  </div>
                ))}
                {!isInCall && users.length === 0 && <p className="col-span-full text-[#747c88]">Channel is empty</p>}
              </div>
            )}
          </main>

          <footer className="p-8 flex justify-center">
            <div className="bg-[rgba(4,55,47,0.8)] backdrop-blur-2xl border border-[rgba(40,245,204,0.3)] rounded-2xl p-4 flex items-center gap-6 shadow-2xl">
              {!isInCall ? (
                <button
                  onClick={handleJoinCall}
                  disabled={!isConnected || isConnecting}
                  className="px-8 py-3 bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] text-black font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50"
                >
                  <Phone className="w-5 h-5" />
                  {isConnecting ? 'Connecting...' : 'Join Channel'}
                </button>
              ) : (
                <>
                  <button onClick={toggleMute} className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${isMuted ? 'bg-red-600 border-red-400' : 'bg-[rgba(40,245,204,0.1)] border-[rgba(40,245,204,0.3)]'}`}>
                    {isMuted ? <MicOff className="w-5 h-5 text-white" /> : <Mic className="w-5 h-5 text-[#28f5cc]" />}
                  </button>
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-[#28f5cc]" />
                    <input type="range" min="0" max="100" value={volume} onChange={(e) => setVolume(Number(e.target.value))} className="w-24 accent-[#28f5cc]" />
                  </div>
                  <button onClick={() => handleLeaveCall(true)} className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-all">
                    <PhoneOff className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
