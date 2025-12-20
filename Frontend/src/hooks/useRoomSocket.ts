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
  onError?: (error: string) => void;
}

export function useRoomSocket(
  roomId: number | null,
  communityId: number | null,
  callbacks: RoomSocketCallbacks = {}
) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  const connect = useCallback(() => {
    if (!roomId || !user?.token) {
      return;
    }

    if (socketRef.current?.connected) {
      socketRef.current.disconnect();
    }

    const socket = io(WS_BASE_URL, {
      auth: {
        token: user.token
      },
      transports: ['websocket']
    });

    socket.on('connect', () => {
      setIsConnected(true);
      setError(null);
      
      // Join general room for messages
      socket.emit('room:join', { roomId });
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err);
      setError(err.message);
      callbacks.onError?.(err.message);
      setIsConnected(false);
    });

    socket.on('room:message', (data: MessageDto) => {
      callbacks.onMessage?.(data);
    });

    socket.on('voice:presence', (data: { roomId: number, users: UserDto[] }) => {
      if (Number(data.roomId) === Number(roomId)) {
        callbacks.onPresence?.(data.users);
      }
    });

    socket.on('voice:signal', (data: { from: number, signal: any, roomId: number }) => {
      if (Number(data.roomId) === Number(roomId)) {
        callbacks.onSignal?.(data);
      }
    });

    socket.on('room:error', (data: { message: string }) => {
      setError(data.message);
      callbacks.onError?.(data.message);
    });

    socket.on('disconnect', () => {
      setIsConnected(false);
    });

    socketRef.current = socket;
  }, [roomId, user?.token, callbacks]);

  const disconnect = useCallback(() => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback(
    (content: string, contentType: string = 'TEXT') => {
      if (!socketRef.current?.connected || !roomId) {
        throw new Error('Not connected to WebSocket');
      }

      socketRef.current.emit('room:message', {
        roomId,
        content,
        contentType,
      });
    },
    [roomId]
  );

  const joinVoice = useCallback(() => {
    if (!socketRef.current?.connected || !roomId) {
      throw new Error('Not connected to WebSocket');
    }

    socketRef.current.emit('voice:join', { roomId });
  }, [roomId]);

  const leaveVoice = useCallback(() => {
    if (!socketRef.current?.connected || !roomId) {
      throw new Error('Not connected to WebSocket');
    }

    socketRef.current.emit('voice:leave', { roomId });
  }, [roomId]);

  const sendSignal = useCallback((to: number, signal: any) => {
    if (!socketRef.current?.connected || !roomId) return;
    socketRef.current.emit('voice:signal', { to, signal, roomId });
  }, [roomId]);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    error,
    sendMessage,
    joinVoice,
    leaveVoice,
    sendSignal,
    reconnect: connect,
    socket: socketRef.current
  };
}
