/**
 * Message API wrapper
 * Handles all message-related API calls
 */

// Base API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Message DTO matching backend structure
 */
export interface MessageDto {
  id: number;
  roomId: number;
  userId: number;
  username: string;
  content: string;
  contentType: string;
  createdAt: string;
}

/**
 * Paginated response for messages
 */
export interface MessagePage {
  content: MessageDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

/**
 * Fetches messages for a room with pagination
 * @param communityId - The ID of the community
 * @param roomId - The ID of the room
 * @param page - Page number (0-indexed)
 * @param limit - Number of messages per page
 * @returns Promise resolving to MessagePage
 * @throws Error if the API call fails
 */
export const getRoomMessages = async (
  communityId: number,
  roomId: number,
  page: number = 0,
  limit: number = 50
): Promise<MessagePage> => {
  try {
    // Backend endpoint is /api/chat/rooms/{roomId}/messages
    const response = await fetch(
      `${API_BASE_URL}/api/chat/rooms/${roomId}/messages?page=${page}&size=${limit}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch messages: ${response.status} ${response.statusText}`);
    }

    const data: MessagePage = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching room messages:', error);
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
    // Note: This endpoint may not exist yet, returning empty for now
    // Presence will be handled via WebSocket
    return {
      roomId,
      activeUsers: 0,
      users: [],
    };
  } catch (error) {
    console.error('Error fetching voice room metadata:', error);
    throw error;
  }
};

