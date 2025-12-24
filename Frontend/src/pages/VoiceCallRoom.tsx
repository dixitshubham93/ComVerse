import { useState, useEffect, useRef, useCallback } from 'react';
import { Mic, MicOff, Phone, PhoneOff, Volume2 } from 'lucide-react';
import { UserSpaceBackground } from '../components/UserSpaceBackground';
import { CommunitySidebar } from '../components/CommunitySidebar';
import { useRoomSocket, UserDto } from '../hooks/useRoomSocket';
import { getVoiceRoomMetadata } from '../api/messageApi';
import { useAuth } from '../contexts/AuthContext';
import Peer from 'simple-peer';

const convertUserDto = (u: UserDto): VoiceUser => ({
  id: u.id.toString(),
  name: u.username,
  avatar: u.avatarUrl || u.username.charAt(0).toUpperCase(),
  isTalking: false,
  isMuted: false,
  isOnline: true,
  inCall: !!u.inCall,
  userId: u.id
});

interface VoiceUser {
  id: string;
  name: string;
  avatar: string;
  isTalking: boolean;
  isMuted: boolean;
  isOnline: boolean;
  inCall: boolean;
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
  const peersRef = useRef<Map<number, any>>(new Map()); 
  const audioElementsRef = useRef<Map<number, HTMLAudioElement>>(new Map());
  const presenceRef = useRef<UserDto[]>([]);
  const audioContainerRef = useRef<HTMLDivElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  const destroyPeer = useCallback((userId: number) => {
    console.log(`[VC] Destroying peer for user ${userId}`);
    const peer = peersRef.current.get(userId);
    if (peer) {
      try {
        peer.destroy();
      } catch (err) {
        console.error(`[VC] Error destroying peer ${userId}:`, err);
      }
      peersRef.current.delete(userId);
    }
    const audio = audioElementsRef.current.get(userId);
    if (audio) {
      audio.pause();
      audio.srcObject = null;
      audio.remove();
      audioElementsRef.current.delete(userId);
    }
  }, []);

  const createPeer = useCallback((userId: number, initiator: boolean, stream: MediaStream) => {
    console.log(`[VC] Creating peer for user ${userId}, initiator: ${initiator}`);
    
    if (peersRef.current.has(userId)) {
      console.log(`[VC] Cleaning up existing peer for ${userId}`);
      destroyPeer(userId);
    }

    const peer = new Peer({
      initiator,
      stream,
      trickle: false,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      }
    });

    peer.on('signal', (signal: any) => {
      console.log(`[VC] Generated signal for ${userId}, type: ${signal.type}`);
      sendSignal(userId, signal);
    });

      peer.on('stream', (remoteStream: MediaStream) => {
        console.log(`[VC] Received remote stream from user ${userId}`);
        let audio = audioElementsRef.current.get(userId);
        if (!audio) {
          audio = document.createElement('audio');
          audio.autoplay = true;
          audio.playsInline = true;
          audio.dataset.userId = userId.toString();
          audioElementsRef.current.set(userId, audio);
          if (audioContainerRef.current) {
            audioContainerRef.current.appendChild(audio);
          }
        }
        audio.srcObject = remoteStream;
        audio.volume = volumeRef.current / 100;
        
        audio.play().catch(err => {
          console.warn(`[VC] Auto-play prevented for user ${userId}:`, err);
        });
      });

    peer.on('error', (err: any) => {
      console.error(`[VC] Peer error with ${userId}:`, err);
      destroyPeer(userId);
    });

    peer.on('close', () => {
      console.log(`[VC] Peer connection closed with ${userId}`);
      destroyPeer(userId);
    });

    peersRef.current.set(userId, peer);
    return peer;
  }, [destroyPeer]);

  // Socket handlers using useRoomSocket hook
  const { isConnected, isConnecting, joinVoice, leaveVoice, sendSignal, sendMute, sendSpeaking } = useRoomSocket(
    currentRoomId, 
    communityId, 
    {
      onPresence: useCallback((newPresence: UserDto[]) => {
        console.log('[VC] Presence update received:', newPresence.length, 'users');
        const currentUserId = Number(user?.id);
        
        setUsers(newPresence.map(convertUserDto));
        
        if (isInCallRef.current && localStreamRef.current) {
          const inCallUsers = newPresence.filter(u => u.inCall && Number(u.id) !== currentUserId);
          const previousInCallIds = new Set(
            presenceRef.current.filter(u => u.inCall).map(u => Number(u.id))
          );
          
          console.log('[VC] In-call users:', inCallUsers.length);
          
            inCallUsers.forEach(u => {
              const userId = Number(u.id);
              
              if (!peersRef.current.has(userId)) {
                const shouldInitiate = currentUserId > userId;
                console.log(`[VC] New user ${userId} found in presence. My ID: ${currentUserId}, I initiate: ${shouldInitiate}`);
                
                if (shouldInitiate) {
                  createPeer(userId, true, localStreamRef.current!);
                }
              }
            });

          const inCallIds = new Set(inCallUsers.map(u => Number(u.id)));
          peersRef.current.forEach((_, userId) => {
            if (!inCallIds.has(userId)) {
              console.log(`[VC] User ${userId} left call, destroying peer`);
              destroyPeer(userId);
            }
          });
        }

        presenceRef.current = newPresence;
      }, [user?.id, createPeer, destroyPeer]),

      onSignal: useCallback((data: { from: number; signal: any; roomId: number }) => {
        if (!isInCallRef.current || !localStreamRef.current) {
          console.log('[VC] Ignoring signal - not in call');
          return;
        }
        
        console.log(`[VC] Received signal from user ${data.from}`);
        
        let peer = peersRef.current.get(data.from);
        if (!peer) {
          console.log(`[VC] Creating peer in response to signal from ${data.from}`);
          peer = createPeer(data.from, false, localStreamRef.current);
        }
        
        if (peer) {
          try {
            peer.signal(data.signal);
          } catch (err) {
            console.error(`[VC] Error signaling peer ${data.from}:`, err);
          }
        }
      }, [createPeer]),

      onMute: useCallback(({ userId, isMuted }: { userId: number; isMuted: boolean }) => {
        setUsers(prev => prev.map(u => 
          u.userId === userId ? { ...u, isMuted } : u
        ));
      }, []),

      onSpeaking: useCallback(({ userId, isSpeaking }: { userId: number; isSpeaking: boolean }) => {
        setUsers(prev => prev.map(u => 
          u.userId === userId ? { ...u, isTalking: isSpeaking } : u
        ));
      }, [])
    }
  );

  // Audio analysis for local speaking detection
  useEffect(() => {
    if (!isInCall || !localStreamRef.current || isMuted) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      setUsers(prev => prev.map(u => 
        u.userId === Number(user?.id) ? { ...u, isTalking: false } : u
      ));
      return;
    }

    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(localStreamRef.current);
      source.connect(analyser);
      analyser.fftSize = 256;
      
      analyserRef.current = analyser;
      audioContextRef.current = audioContext;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let wasSpeaking = false;
      const checkSpeaking = () => {
        if (!analyserRef.current) return;
        
        analyserRef.current.getByteFrequencyData(dataArray);
        
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        const isCurrentlySpeaking = average > 15; // Threshold for speaking
        
        if (isCurrentlySpeaking !== wasSpeaking) {
          wasSpeaking = isCurrentlySpeaking;
          sendSpeaking(isCurrentlySpeaking);
          setUsers(prev => prev.map(u => 
            u.userId === Number(user?.id) ? { ...u, isTalking: isCurrentlySpeaking } : u
          ));
        }
        
        animationFrameRef.current = requestAnimationFrame(checkSpeaking);
      };
      
      checkSpeaking();
    } catch (err) {
      console.error('[VC] Audio analysis failed:', err);
    }

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
    };
  }, [isInCall, isMuted, user?.id, sendSpeaking]);

  useEffect(() => {
    const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8081';
    fetch(`${WS_URL}/api/rooms/${currentRoomId}/voice-metadata`)
      .then(res => res.json())
      .catch(err => console.error('❌ Backend NOT reachable:', err));
  }, [currentRoomId]);

  useEffect(() => {
    volumeRef.current = volume;
    audioElementsRef.current.forEach(audio => {
      audio.volume = volume / 100;
    });
  }, [volume]);

  const handleJoinCall = async () => {
    if (isInCall || !isConnected) return;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      localStreamRef.current = stream;
      isInCallRef.current = true;
      
        const success = joinVoice();
        if (success) {
          setIsInCall(true);
          
          // Proactively check for existing users to connect with
          const currentUserId = Number(user?.id);
          presenceRef.current.forEach(u => {
            const userId = Number(u.id);
            if (u.inCall && userId !== currentUserId && !peersRef.current.has(userId)) {
              const shouldInitiate = currentUserId > userId;
              if (shouldInitiate) {
                console.log(`[VC] Proactively initiating peer with existing user ${userId}`);
                createPeer(userId, true, stream);
              }
            }
          });
        } else {
        stream.getTracks().forEach(t => t.stop());
        localStreamRef.current = null;
        isInCallRef.current = false;
      }
    } catch (err) {
      console.error('[VC] Microphone access error:', err);
      alert('Microphone access is required for voice chat.');
    }
  };

  const handleLeaveCall = useCallback((isManual: boolean = false) => {
    isInCallRef.current = false;
    setIsInCall(false);
    setIsMuted(false);
    
    leaveVoice();
    
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    
    peersRef.current.forEach(p => {
      try {
        p.destroy();
      } catch (err) {
        console.error('[VC] Error destroying peer:', err);
      }
    });
    peersRef.current.clear();
    
    audioElementsRef.current.forEach(a => {
      a.pause();
      a.srcObject = null;
      a.remove();
    });
    audioElementsRef.current.clear();
  }, [leaveVoice]);

  const toggleMute = () => {
    if (localStreamRef.current) {
      const track = localStreamRef.current.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        const newMuted = !track.enabled;
        setIsMuted(newMuted);
        sendMute(newMuted);
      }
    }
  };

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
  }, [currentRoomId]);

  useEffect(() => {
    return () => {
      if (isInCallRef.current) {
        handleLeaveCall();
      }
    };
  }, [handleLeaveCall]);

  const renderAvatar = (
    user: VoiceUser | { name: string; avatar: string }, 
    size: string = 'w-28 h-28', 
    textSize: string = 'text-4xl'
  ) => {
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
            ? '0 0 30px rgba(40, 245, 204, 0.6), 0 0 60px rgba(40, 245, 204, 0.2)'
            : '0 0 15px rgba(40, 245, 204, 0.2)',
          transform: isTalking ? 'scale(1.05)' : 'scale(1)',
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
        {isTalking && (
          <div className="absolute inset-0 rounded-full animate-pulse border-4 border-[#28f5cc]/30 pointer-events-none" />
        )}
      </div>
    );
  };

  const inCallUsers = users.filter(u => u.inCall);
  const inCallCount = inCallUsers.length;

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
                  <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-[#04ad7b]' : 'bg-gray-500'}`} />
                  <span className="text-[#9aa0aa] text-[10px] uppercase tracking-wider">
                    {isConnecting ? 'Connecting...' : isConnected ? 'Voice Channel' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
            <div className="px-4 py-2 rounded-lg bg-[rgba(4,55,47,0.5)] border border-[rgba(40,245,204,0.2)] flex items-center gap-3">
              <span className="text-[#28f5cc] text-sm font-medium">
                {inCallCount} in call
              </span>
            </div>
          </header>

          <main className={`flex-1 flex items-center justify-center p-8 transition-opacity duration-300 ${isTransitioning ? 'opacity-50' : 'opacity-100'}`}>
            {isLoadingMetadata ? (
              <div className="w-10 h-10 border-2 border-[#28f5cc] border-t-transparent rounded-full animate-spin" />
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8 max-w-5xl">
                {inCallUsers.map(u => (
                  <div key={u.id} className="flex flex-col items-center gap-3">
                    {renderAvatar(u)}
                    <span className="text-white text-xs font-medium">
                      {u.name} {u.userId === Number(user?.id) ? '(You)' : ''}
                    </span>
                  </div>
                ))}
                
                {inCallCount === 0 && (
                  <p className="col-span-full text-[#747c88] text-center">
                    {isInCall ? 'Waiting for others to join...' : 'No one in the call. Click "Join Channel" to start!'}
                  </p>
                )}
              </div>
            )}
          </main>

          <footer className="p-8 flex justify-center">
            <div className="bg-[rgba(4,55,47,0.8)] backdrop-blur-2xl border border-[rgba(40,245,204,0.3)] rounded-2xl p-4 flex items-center gap-6 shadow-2xl">
              {!isInCall ? (
                <button
                  onClick={handleJoinCall}
                  disabled={!isConnected || isConnecting}
                  className="px-8 py-3 bg-gradient-to-r from-[#04ad7b] to-[#28f5cc] text-black font-bold rounded-xl flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Phone className="w-5 h-5" />
                  {isConnecting ? 'Connecting...' : !isConnected ? 'Connection Lost' : 'Join Channel'}
                </button>
              ) : (
                <>
                  <button 
                    onClick={toggleMute} 
                    className={`w-12 h-12 rounded-xl flex items-center justify-center border transition-all ${
                      isMuted 
                        ? 'bg-red-600 border-red-400' 
                        : 'bg-[rgba(40,245,204,0.1)] border-[rgba(40,245,204,0.3)] hover:bg-[rgba(40,245,204,0.2)]'
                    }`}
                  >
                    {isMuted ? (
                      <MicOff className="w-5 h-5 text-white" />
                    ) : (
                      <Mic className="w-5 h-5 text-[#28f5cc]" />
                    )}
                  </button>
                  
                  <div className="flex items-center gap-3">
                    <Volume2 className="w-4 h-4 text-[#28f5cc]" />
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      value={volume} 
                      onChange={(e) => setVolume(Number(e.target.value))} 
                      className="w-24 accent-[#28f5cc]" 
                    />
                    <span className="text-[#28f5cc] text-sm w-8">{volume}%</span>
                  </div>
                  
                  <button 
                    onClick={() => handleLeaveCall(true)} 
                    className="w-12 h-12 rounded-xl flex items-center justify-center bg-red-600 hover:bg-red-700 text-white transition-all"
                  >
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
