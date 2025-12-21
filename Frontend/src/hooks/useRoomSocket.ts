import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

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
      console.log('Socket connected successfully');
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
      
      socket.emit('room:join', { roomId });
      // Also emit voice:join if we want to auto-join, but typically we wait for user action
    });

    socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      setIsConnected(true);
      setIsConnecting(false);
      socket.emit('room:join', { roomId });
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
      callbacksRef.current.onMessage?.(data);
    });

    socket.on('voice:presence', (data: { roomId: number, users: UserDto[] }) => {
      if (Number(data.roomId) === Number(roomId)) {
        callbacksRef.current.onPresence?.(data.users);
      }
    });

      socket.on('voice:signal', (data: { from: number, signal: any, roomId: number }) => {
        if (Number(data.roomId) === Number(roomId)) {
          callbacksRef.current.onSignal?.(data);
        }
      });

      socket.on('voice:mute', (data: { userId: number, isMuted: boolean, roomId: number }) => {
        if (Number(data.roomId) === Number(roomId)) {
          callbacksRef.current.onMute?.({ userId: data.userId, isMuted: data.isMuted });
        }
      });

    socket.on('room:error', (data: { message: string }) => {
      setError(data.message);
      callbacksRef.current.onError?.(data.message);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
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
    sendMessage,
    joinVoice,
    leaveVoice,
    sendSignal,
    sendMute,
    reconnect: connect,
    socket: socketRef.current
  };
}
