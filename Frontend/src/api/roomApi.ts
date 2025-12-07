/**
 * Room API wrapper
 * Handles all room-related API calls
 */

// Base API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Room Type enum matching backend
 */
export enum RoomType {
  VOICE_CHAT = 'VOICE_CHAT',
  POSTS = 'POSTS',
  CHAT = 'CHAT',
}

/**
 * Room DTO matching backend structure
 */
export interface RoomDto {
  id: number;
  communityId: number;
  name: string;
  type: RoomType;
  config: string | null;
  isDefaultRoom: boolean;
}

/**
 * Create Room Request DTO
 */
export interface CreateRoomRequest {
  name: string;
  type: RoomType;
  config?: string | null;
  isDefaultRoom?: boolean;
}

/**
 * Creates a new room in a community
 * @param communityId - The ID of the community
 * @param data - Room creation data
 * @returns Promise resolving to RoomDto
 * @throws Error if the API call fails
 */
export const createRoom = async (communityId: number, data: CreateRoomRequest): Promise<RoomDto> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rooms/${communityId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create room: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const roomData: RoomDto = await response.json();
    return roomData;
  } catch (error) {
    console.error('Error creating room:', error);
    throw error;
  }
};

/**
 * Fetches all rooms for a specific community
 * @param communityId - The ID of the community
 * @returns Promise resolving to array of RoomDto
 * @throws Error if the API call fails
 */
export const getCommunityRooms = async (communityId: number): Promise<RoomDto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/rooms/community/${communityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch community rooms: ${response.status} ${response.statusText}`);
    }

    const data: RoomDto[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching community rooms:', error);
    throw error;
  }
};

