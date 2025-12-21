/**
 * Message API wrapper
 * Handles all message-related API calls
 */

// Base API URL from environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL ?? 'http://localhost:8080';

/**
 * Message DTO matching backend structure
 */
export interface MessageDto {
  id: number;
  roomId: number;
  userId: number;
  content: string;
  imageUrl?: string | null;
  createdAt: string;
  user?: {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
}

/**
 * Fetches messages for a room
 * @param roomId - The ID of the room
 * @param limit - Number of messages to fetch (default 50)
 * @param offset - Offset for pagination (default 0)
 * @returns Promise resolving to MessageDto array
 * @throws Error if the API call fails
 */
export const getRoomMessages = async (
  roomId: number,
  limit: number = 50,
  offset: number = 0
): Promise<MessageDto[]> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(
      `${API_BASE_URL}/messages/${roomId}?limit=${limit}&offset=${offset}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // Backend returns { success, data: MessageDto[] }
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching room messages:', error);
    return [];
  }
};

/**
 * Sends a message to a room
 * @param roomId - The ID of the room
 * @param content - Message content
 * @param imageUrl - Optional image URL
 * @returns Promise resolving to created MessageDto
 * @throws Error if the API call fails
 */
export const sendMessage = async (
  roomId: number,
  content: string,
  imageUrl?: string
): Promise<MessageDto> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/messages/${roomId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify({ content, imageUrl }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to send message: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    if (!result.success || !result.data) {
      throw new Error(result.message || 'Failed to send message');
    }
    return result.data;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

/**
 * Voice room metadata DTO
 * Note: This endpoint may not exist in backend yet, so presence is handled via WebSocket
 */
export interface VoiceRoomMetadata {
  roomId: number;
  activeUsers: number;
  users: Array<{
    id: number;
    username: string;
    avatarUrl: string | null;
  }>;
}

/**
 * Fetches voice room metadata
 * @param roomId - The ID of the voice room
 * @returns Promise resolving to VoiceRoomMetadata
 * @throws Error if the API call fails
 */
export const getVoiceRoomMetadata = async (roomId: number): Promise<VoiceRoomMetadata> => {
  try {
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}/voice-metadata`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch metadata: ${response.status}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }
    return {
      roomId,
      activeUsers: 0,
      users: [],
    };
  } catch (error) {
    console.error('Error fetching voice room metadata:', error);
    return {
      roomId,
      activeUsers: 0,
      users: [],
    };
  }
};

