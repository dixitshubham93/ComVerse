import { useEffect, useRef, useState, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import SockJS from 'sockjs-client';
import { Client, IMessage } from '@stomp/stompjs';

const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080';

export interface DirectMessage {
  id: bigint;
  senderId: bigint;
  receiverId: bigint;
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
  const clientRef = useRef<Client | null>(null);
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

    try {
      const token = localStorage.getItem('authToken');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const socket = new SockJS(`${WS_BASE_URL}/socket`);
      const client = new Client({
        webSocketFactory: () => socket,
        connectHeaders: {
          Authorization: `Bearer ${token}`
        },
        debug: (str) => {
          console.log('STOMP Debug:', str);
        },
        onConnect: () => {
          console.log('Connected to DM WebSocket');
          setIsConnected(true);
          setError(null);
          reconnectAttempts.current = 0;

          // Join DM room
          client.subscribe(`/user/dm:${user.id}`, (message: IMessage) => {
            try {
              const dm: DirectMessage = JSON.parse(message.body);
              callbacks.onMessageReceived?.(dm);
            } catch (err) {
              console.error('Error parsing DM message:', err);
            }
          });

          // Listen for sent messages confirmation
          client.subscribe(`/user/dm:sent:${user.id}`, (message: IMessage) => {
            try {
              const dm: DirectMessage = JSON.parse(message.body);
              callbacks.onMessageSent?.(dm);
            } catch (err) {
              console.error('Error parsing sent DM message:', err);
            }
          });

          // Join the DM channel
          client.publish({
            destination: '/app/dm:join',
            body: JSON.stringify({})
          });
        },
        onStompError: (frame) => {
          console.error('Broker reported error: ' + frame.headers['message']);
          console.error('Additional details: ' + frame.body);
          setError('Connection error: ' + frame.headers['message']);
        },
        onDisconnect: () => {
          console.log('Disconnected from DM WebSocket');
          setIsConnected(false);
        },
        onWebSocketClose: () => {
          console.log('WebSocket connection closed');
          setIsConnected(false);
          
          // Attempt to reconnect with exponential backoff
          if (reconnectAttempts.current < maxReconnectAttempts) {
            const delay = Math.min(1000 * 2 ** reconnectAttempts.current, 10000);
            reconnectAttempts.current++;
            
            reconnectTimeoutRef.current = setTimeout(() => {
              console.log(`Attempting to reconnect (${reconnectAttempts.current}/${maxReconnectAttempts})`);
              connect();
            }, delay);
          } else {
            setError('Failed to reconnect after maximum attempts');
          }
        }
      });

      client.activate();
      clientRef.current = client;
    } catch (err) {
      console.error('Error connecting to WebSocket:', err);
      setError('Failed to connect to messaging service');
    }
  }, [user?.id, otherUserId, callbacks]);

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

  const sendDM = useCallback(
    (content: string) => {
      if (!clientRef.current || !clientRef.current.connected) {
        console.warn('Cannot send DM: Not connected to WebSocket');
        return;
      }

      if (!otherUserId) {
        console.warn('Cannot send DM: No recipient specified');
        return;
      }

      try {
        clientRef.current.publish({
          destination: '/app/dm:send',
          body: JSON.stringify({
            receiverId: otherUserId.toString(),
            content
          })
        });
      } catch (err) {
        console.error('Error sending DM via WebSocket:', err);
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
  }, [user?.id, otherUserId, connect, disconnect]);

  return {
    isConnected,
    error,
    sendDM,
    reconnect: connect,
  };
}