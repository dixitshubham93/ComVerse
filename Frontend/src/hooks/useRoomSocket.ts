import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8081';

export interface MessageDto {
  id: number;
  roomId: number;
  userId: number;
  username: string;
  content: string;
  contentType: string;
  createdAt: string;
}

export interface UserDto {
  id: number;
  username: string;
  avatarUrl: string | null;
  inCall?: boolean;
}

export interface RoomSocketCallbacks {
  onMessage?: (message: MessageDto) => void;
  onMessageUpdated?: (message: MessageDto) => void;
  onMessageDeleted?: (messageId: number) => void;
    onPresence?: (users: UserDto[]) => void;
    onSignal?: (data: { from: number; signal: any; roomId: number }) => void;
    onMute?: (data: { userId: number; isMuted: boolean }) => void;
    onSpeaking?: (data: { userId: number; isSpeaking: boolean }) => void;
    onError?: (error: string) => void;

}

export function useRoomSocket(
  roomId: number | null,
  communityId: number | null,
  callbacks: RoomSocketCallbacks = {}
) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participants, setParticipants] = useState<UserDto[]>([]);
  const socketRef = useRef<Socket | null>(null);
  const callbacksRef = useRef(callbacks);

  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  const connect = useCallback(() => {
    console.log('%c[Socket Hook] === CONNECTION ATTEMPT ===', 'color: #00ffff; font-weight: bold');
    console.log('[Socket Hook] Room ID:', roomId);
    console.log('[Socket Hook] User Token:', user?.token ? 'EXISTS ✓' : 'MISSING ✗');
    console.log('[Socket Hook] WS URL:', WS_BASE_URL);

    if (!roomId) {
      console.warn('[Socket Hook] ⚠️ No room ID provided');
      return;
    }

    if (!user?.token) {
      console.error('[Socket Hook] ❌ No user token available');
      setError('Authentication token missing');
      return;
    }

    if (socketRef.current?.connected) {
      console.log('[Socket Hook] ✓ Already connected');
      setIsConnected(true);
      return;
    }

    console.log('[Socket Hook] Creating new socket connection...');
    setIsConnecting(true);
    
    const socket = io(WS_BASE_URL, {
      auth: {
        token: user.token
      },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 10000,
    });

    // Connection successful
    socket.on('connect', () => {
      console.log('%c[Socket Hook] ✅ CONNECTED successfully!', 'color: #00ff00; font-weight: bold');
      console.log('[Socket Hook] Socket ID:', socket.id);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      
      console.log(`%c[Socket Hook] Emitting room:join for room ${roomId}`, 'color: #00ffff');
      socket.emit('room:join', { roomId });
    });

    // Voice presence updates
    socket.on('voice:presence', (data: { roomId: number | string, users: UserDto[] }) => {
      console.log('%c[Socket Hook] RECEIVED voice:presence', 'color: #ffff00; font-weight: bold');
      console.log('[Socket Hook] Room:', data.roomId, 'Users:', data.users?.length);
      
      const receivedRoomId = Number(data.roomId);
      const currentRoomId = Number(roomId);
      
      if (receivedRoomId === currentRoomId) {
        console.log('[Socket Hook] ✓ Presence for current room, updating...');
        setParticipants(data.users);
        if (callbacksRef.current.onPresence) {
          callbacksRef.current.onPresence(data.users);
        }
      } else {
        console.log('[Socket Hook] ⚠️ Presence for different room, ignoring');
      }
    });

    // Reconnection events
    socket.on('reconnect', (attemptNumber) => {
      console.log('[Socket Hook] ♻️ Reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setIsConnecting(false);
      socket.emit('room:join', { roomId });
    });

    socket.on('reconnecting', (attemptNumber) => {
      console.log('[Socket Hook] 🔄 Reconnecting, attempt:', attemptNumber);
      setIsConnecting(true);
    });

    socket.on('reconnect_failed', () => {
      console.error('[Socket Hook] ❌ Reconnection failed after all attempts');
      setError('Failed to reconnect');
      setIsConnected(false);
      setIsConnecting(false);
    });

    // Connection errors
    socket.on('connect_error', (err) => {
      console.error('%c[Socket Hook] ❌ CONNECTION ERROR', 'color: #ff0000; font-weight: bold');
      console.error('[Socket Hook] Error:', err.message);
      console.error('[Socket Hook] Error details:', err);
      
      if (err.message.includes('Authentication')) {
        console.error('[Socket Hook] 🔐 Auth failed - check your JWT token');
        setError('Authentication failed - please login again');
      } else if (err.message.includes('timeout')) {
        console.error('[Socket Hook] ⏱️ Connection timeout - check backend URL');
        setError('Connection timeout - is backend running?');
      } else {
        setError(err.message);
      }
      
      callbacksRef.current.onError?.(err.message);
      setIsConnected(false);
      setIsConnecting(false);
    });

    // Room messages
    socket.on('room:message', (data: MessageDto) => {
      console.log('[Socket Hook] 💬 Received room:message', data);
      callbacksRef.current.onMessage?.(data);
    });

    // Voice signaling
    socket.on('voice:signal', (data: { from: number, signal: any, roomId: number | string }) => {
      console.log('[Socket Hook] 📡 Received voice:signal from', data.from, 'for room', data.roomId);
      if (Number(data.roomId) === Number(roomId)) {
        callbacksRef.current.onSignal?.({
          ...data,
          roomId: Number(data.roomId)
        });
      }
    });

    // Voice mute status
    socket.on('voice:mute', (data: { userId: number, isMuted: boolean, roomId: number | string }) => {
      console.log('[Socket Hook] 🔇 Received voice:mute from', data.userId, ':', data.isMuted);
      if (Number(data.roomId) === Number(roomId)) {
        callbacksRef.current.onMute?.({ userId: Number(data.userId), isMuted: data.isMuted });
      }
    });

    // Voice speaking status
    socket.on('voice:speaking', (data: { userId: number, isSpeaking: boolean, roomId: number | string }) => {
      if (Number(data.roomId) === Number(roomId)) {
        callbacksRef.current.onSpeaking?.({ userId: Number(data.userId), isSpeaking: data.isSpeaking });
      }
    });

    // Room errors
    socket.on('room:error', (data: { message: string }) => {
      console.error('[Socket Hook] 🚫 Room error:', data.message);
      setError(data.message);
      callbacksRef.current.onError?.(data.message);
    });

    // Disconnection
    socket.on('disconnect', (reason) => {
      console.log('%c[Socket Hook] ❌ DISCONNECTED', 'color: #ff6600; font-weight: bold');
      console.log('[Socket Hook] Reason:', reason);
      
      if (reason === 'io server disconnect') {
        console.log('[Socket Hook] Server disconnected us - reconnecting...');
        socket.connect();
      } else if (reason === 'transport close' || reason === 'ping timeout') {
        console.log('[Socket Hook] Connection lost - will auto-reconnect');
      }
      
      setIsConnected(false);
      setParticipants([]);
    });

    socketRef.current = socket;
  }, [roomId, user?.token]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('[Socket Hook] Manually disconnecting socket');
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
    setIsConnecting(false);
    setParticipants([]);
  }, []);

  const sendMessage = useCallback(
    (content: string, contentType: string = 'TEXT') => {
      if (!socketRef.current?.connected) {
        console.warn('[Socket Hook] ⚠️ Cannot send message: Not connected');
        return;
      }
      if (!roomId) return;

      socketRef.current.emit('room:message', {
        roomId,
        content,
        contentType,
      });
    },
    [roomId]
  );

  const joinVoice = useCallback(() => {
    if (!socketRef.current?.connected) {
      console.warn('[Socket Hook] ⚠️ Cannot join voice: Not connected to WebSocket');
      return false;
    }
    if (!roomId) return false;

    console.log('[Socket Hook] 🎤 Emitting voice:join for room:', roomId);
    socketRef.current.emit('voice:join', { roomId });
    return true;
  }, [roomId]);

  const leaveVoice = useCallback(() => {
    if (socketRef.current?.connected && roomId) {
      console.log('[Socket Hook] 🔇 Emitting voice:leave for room:', roomId);
      socketRef.current.emit('voice:leave', { roomId });
      return true;
    }
    return false;
  }, [roomId]);

  const sendSignal = useCallback((to: number, signal: any) => {
    if (!socketRef.current?.connected || !roomId) {
      console.warn('[Socket Hook] ⚠️ Cannot send signal: Not connected');
      return;
    }
    socketRef.current.emit('voice:signal', { to, signal, roomId });
  }, [roomId]);

  const sendMute = useCallback((isMuted: boolean) => {
    if (!socketRef.current?.connected || !roomId) {
      console.warn('[Socket Hook] ⚠️ Cannot send mute: Not connected');
      return;
    }
    socketRef.current.emit('voice:mute', { roomId, isMuted });
  }, [roomId]);

  const sendSpeaking = useCallback((isSpeaking: boolean) => {
    if (!socketRef.current?.connected || !roomId) {
      console.warn('[Socket Hook] ⚠️ Cannot send speaking: Not connected');
      return;
    }
    socketRef.current.emit('voice:speaking', { roomId, isSpeaking });
  }, [roomId]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    isConnecting,
    error,
    participants,
    sendMessage,
    joinVoice,
    leaveVoice,
    sendSignal,
    sendMute,
    sendSpeaking,
    reconnect: connect,
    socket: socketRef.current
  };
}
