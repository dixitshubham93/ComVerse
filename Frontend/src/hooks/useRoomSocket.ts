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
    if (!roomId || !user?.token) {
      return;
    }

    if (socketRef.current?.connected) {
      setIsConnected(true);
      return;
    }

    setIsConnecting(true);
    const socket = io(WS_BASE_URL, {
      auth: {
        token: user.token
      },
      transports: ['websocket'],
      reconnectionAttempts: 5,
      timeout: 10000,
    });

    socket.on('connect', () => {
      console.log('%c[Socket Hook] CONNECTED successfully!', 'color: #00ff00; font-weight: bold');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    });

    socket.on('voice:presence', (data: { roomId: number | string, users: UserDto[] }) => {
      console.log('%c[Socket Hook] RECEIVED voice:presence', 'color: #ffff00; font-weight: bold', data);
      const receivedRoomId = Number(data.roomId);
      const currentRoomId = Number(roomId);
      
      if (receivedRoomId === currentRoomId) {
        setParticipants(data.users);
        if (callbacksRef.current.onPresence) {
          callbacksRef.current.onPresence(data.users);
        }
      }
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setIsConnecting(false);
    });

    socket.on('reconnecting', (attemptNumber) => {
      console.log('Socket reconnecting, attempt:', attemptNumber);
      setIsConnecting(true);
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(err.message);
      callbacksRef.current.onError?.(err.message);
      setIsConnected(false);
      setIsConnecting(false);
    });

    socket.on('room:message', (data: MessageDto) => {
      console.log('[Socket] Received room:message', data);
      callbacksRef.current.onMessage?.(data);
    });

    socket.on('voice:signal', (data: { from: number, signal: any, roomId: number | string }) => {
      console.log('[Socket] Received voice:signal from', data.from, 'for room', data.roomId);
      if (Number(data.roomId) === Number(roomId)) {
        callbacksRef.current.onSignal?.({
          ...data,
          roomId: Number(data.roomId)
        });
      }
    });

    socket.on('voice:mute', (data: { userId: number, isMuted: boolean, roomId: number | string }) => {
      console.log('[Socket] Received voice:mute from', data.userId, ':', data.isMuted);
      if (Number(data.roomId) === Number(roomId)) {
        callbacksRef.current.onMute?.({ userId: Number(data.userId), isMuted: data.isMuted });
      }
    });

    socket.on('room:error', (data: { message: string }) => {
      setError(data.message);
      callbacksRef.current.onError?.(data.message);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
      setParticipants([]);
    });

    socketRef.current = socket;
  }, [roomId, user?.token]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      console.log('Disconnecting socket');
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
        console.warn('Cannot send message: Not connected to WebSocket');
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
      console.warn('Cannot join voice: Not connected to WebSocket');
      return false;
    }
    if (!roomId) return false;

    console.log('Emitting voice:join for room:', roomId);
    socketRef.current.emit('voice:join', { roomId });
    return true;
  }, [roomId]);

  const leaveVoice = useCallback(() => {
    if (socketRef.current?.connected && roomId) {
      console.log('Emitting voice:leave for room:', roomId);
      socketRef.current.emit('voice:leave', { roomId });
      return true;
    }
    return false;
  }, [roomId]);

  const sendSignal = useCallback((to: number, signal: any) => {
    if (!socketRef.current?.connected || !roomId) return;
    socketRef.current.emit('voice:signal', { to, signal, roomId });
  }, [roomId]);

  const sendMute = useCallback((isMuted: boolean) => {
    if (!socketRef.current?.connected || !roomId) return;
    socketRef.current.emit('voice:mute', { roomId, isMuted });
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
    reconnect: connect,
    joinChat: () => {
      if (socketRef.current?.connected && roomId) {
        console.log(`%c[Socket Hook] Emitting room:join for room ${roomId}`, 'color: #00ffff');
        socketRef.current.emit('room:join', { roomId });
      }
    },
    socket: socketRef.current
  };
}
