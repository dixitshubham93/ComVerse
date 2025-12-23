import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { io, Socket } from 'socket.io-client';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8081/api';

// Socket.IO must connect to the server *origin* (no "/api" path), otherwise it is treated as a namespace.
const WS_BASE_URL = (() => {
  const explicitWsUrl = (import.meta as any).env?.VITE_WS_URL as string | undefined;
  if (explicitWsUrl) return explicitWsUrl;

  try {
    return new URL(API_URL).origin;
  } catch {
    // Fallback: strip a trailing /api
    return API_URL.replace(/\/?api\/?$/, '');
  }
})();

export interface DirectMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface DMSocketCallbacks {
  onMessageReceived?: (message: DirectMessage) => void;
  onMessageSent?: (message: DirectMessage) => void;
  onError?: (error: string) => void;
}

export function useDMSocket(
  otherUserId: string | bigint,
  callbacks: DMSocketCallbacks = {}
) {
  const { user } = useAuth();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  const connect = useCallback(() => {
    if (!user?.id || !otherUserId) return;

    // Clear any existing reconnection attempts
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    // Disconnect existing socket if any
    if (socketRef.current) {
      socketRef.current.disconnect();
    }

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      // Create Socket.IO connection
      const socket = io(WS_BASE_URL, {
        auth: {
          token: token
        },
        transports: ['websocket', 'polling']
      });

      socket.on('connect', () => {
        console.log('Connected to DM Socket.IO');
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Join DM room
        socket.emit('dm:join');
      });

      socket.on('disconnect', () => {
        console.log('Disconnected from DM Socket.IO');
        setIsConnected(false);
        
        // Attempt to reconnect with exponential backoff
        if (reconnectAttempts.current < maxReconnectAttempts) {
          const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
          reconnectAttempts.current++;
          
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            socket.connect();
          }, delay);
        } else {
          setError('Failed to reconnect after maximum attempts');
        }
      });

      socket.on('connect_error', (err) => {
        console.error('Connection error:', err);
        setError('Failed to connect to messaging service');
        setIsConnected(false);
      });

      // Listen for incoming DMs
      socket.on('dm:receive', (message: any) => {
        try {
          console.log('Received DM:', message);
          const dm: DirectMessage = {
            id: Number(message.id),
            senderId: Number(message.senderId),
            receiverId: Number(message.receiverId),
            content: message.content,
            createdAt: message.createdAt,
            read: message.read || false
          };
          callbacks.onMessageReceived?.(dm);
        } catch (err) {
          console.error('Error parsing DM message:', err);
        }
      });

      // Listen for sent message confirmation
      socket.on('dm:sent', (message: any) => {
        try {
          console.log('DM sent confirmation:', message);
          const dm: DirectMessage = {
            id: Number(message.id),
            senderId: Number(message.senderId),
            receiverId: Number(message.receiverId),
            content: message.content,
            createdAt: message.createdAt,
            read: message.read || false
          };
          callbacks.onMessageSent?.(dm);
        } catch (err) {
          console.error('Error parsing sent DM message:', err);
        }
      });

      // Listen for errors
      socket.on('dm:error', (errorMessage: any) => {
        console.error('DM error:', errorMessage);
        setError(errorMessage.message || 'Unknown error');
        callbacks.onError?.(errorMessage.message || 'Unknown error');
      });

      socketRef.current = socket;
    } catch (err) {
      console.error('Error connecting to Socket.IO:', err);
      setError('Failed to connect to messaging service');
    }
  }, [user?.id, otherUserId, callbacks]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendDM = useCallback(
    (content: string) => {
      if (!socketRef.current || !socketRef.current.connected) {
        console.warn('Cannot send DM: Not connected to Socket.IO');
        return;
      }

      if (!otherUserId) {
        console.warn('Cannot send DM: No recipient specified');
        return;
      }

      try {
        socketRef.current.emit('dm:send', {
          receiverId: otherUserId.toString(),
          content
        });
      } catch (err) {
        console.error('Error sending DM via Socket.IO:', err);
        callbacks.onError?.('Failed to send message');
      }
    },
    [user?.id, otherUserId, callbacks]
  );

  useEffect(() => {
    if (user?.id && otherUserId) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [user?.id, otherUserId]);

  return {
    isConnected,
    error,
    sendDM,
    reconnect: connect,
  };
}