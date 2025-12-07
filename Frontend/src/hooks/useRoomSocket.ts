import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';

// Import WebSocket libraries
// Note: These need to be installed: npm install sockjs-client @stomp/stompjs
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

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

export interface PresencePayload {
  users: UserDto[];
}

export interface RoomSocketCallbacks {
  onMessage?: (message: MessageDto) => void;
  onMessageUpdated?: (message: MessageDto) => void;
  onMessageDeleted?: (messageId: number) => void;
  onPresence?: (users: UserDto[]) => void;
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
  const clientRef = useRef<Client | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const presenceUsersRef = useRef<Map<number, UserDto>>(new Map());

  const connect = useCallback(() => {
    if (!roomId || !communityId || !user?.id) {
      return;
    }


    // Clean up existing connection
    if (clientRef.current?.connected) {
      clientRef.current.deactivate();
    }

    const socket = new SockJS(`${WS_BASE_URL}/ws`);
    const client = new Client({
      webSocketFactory: () => socket as any,
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
      onConnect: () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;

        // Subscribe to room messages
        client.subscribe(`/topic/rooms/${roomId}`, (message: IMessage) => {
          try {
            const data: MessageDto = JSON.parse(message.body);
            callbacks.onMessage?.(data);
          } catch (err) {
            console.error('Error parsing message:', err);
          }
        });

        // Subscribe to voice presence (if voice room)
        client.subscribe(`/topic/vc/${roomId}/join`, (message: IMessage) => {
          try {
            const data = JSON.parse(message.body);
            // Add user to presence map
            // Note: Backend VCPayload only has userId, not username/avatarUrl
            // We'll use placeholders and fetch user details if needed
            if (data.userId) {
              const user: UserDto = {
                id: data.userId,
                username: data.username || `User ${data.userId}`, // Placeholder until we fetch
                avatarUrl: data.avatarUrl || null,
              };
              presenceUsersRef.current.set(data.userId, user);
              callbacks.onPresence?.(Array.from(presenceUsersRef.current.values()));
            }
          } catch (err) {
            console.error('Error parsing voice join:', err);
          }
        });

        client.subscribe(`/topic/vc/${roomId}/leave`, (message: IMessage) => {
          try {
            const data = JSON.parse(message.body);
            // Remove user from presence map
            if (data.userId) {
              presenceUsersRef.current.delete(data.userId);
              callbacks.onPresence?.(Array.from(presenceUsersRef.current.values()));
            }
          } catch (err) {
            console.error('Error parsing voice leave:', err);
          }
        });
      },
      onStompError: (frame) => {
        console.error('STOMP error:', frame);
        setError(frame.headers['message'] || 'WebSocket connection error');
        callbacks.onError?.(frame.headers['message'] || 'WebSocket connection error');
        setIsConnected(false);
      },
      onWebSocketClose: () => {
        setIsConnected(false);
        // Attempt reconnection
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, 5000 * reconnectAttempts.current);
        }
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
    });

    client.activate();
    clientRef.current = client;
  }, [roomId, communityId, user?.id, callbacks]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (clientRef.current) {
      clientRef.current.deactivate();
      clientRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback(
    (content: string, contentType: string = 'TEXT') => {
      if (!clientRef.current?.connected || !user?.id || !roomId) {
        throw new Error('Not connected to WebSocket');
      }

      const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
      const payload = {
        userId,
        content,
        contentType,
      };

      clientRef.current.publish({
        destination: `/app/rooms/${roomId}/send`,
        body: JSON.stringify(payload),
      });
    },
    [user?.id, roomId]
  );

  const joinVoice = useCallback(() => {
    if (!clientRef.current?.connected || !user?.id || !roomId) {
      throw new Error('Not connected to WebSocket');
    }

    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    const payload = {
      userId,
    };

    clientRef.current.publish({
      destination: `/app/vc/${roomId}/join`,
      body: JSON.stringify(payload),
    });
  }, [user?.id, roomId]);

  const leaveVoice = useCallback(() => {
    if (!clientRef.current?.connected || !user?.id || !roomId) {
      throw new Error('Not connected to WebSocket');
    }

    const userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
    const payload = {
      userId,
    };

    clientRef.current.publish({
      destination: `/app/vc/${roomId}/leave`,
      body: JSON.stringify(payload),
    });
  }, [user?.id, roomId]);

  useEffect(() => {
    if (roomId && communityId && user?.id) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [roomId, communityId, user?.id, connect, disconnect]);

  return {
    isConnected,
    error,
    sendMessage,
    joinVoice,
    leaveVoice,
    reconnect: connect,
  };
}

