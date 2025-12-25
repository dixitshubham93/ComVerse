/**
 * Room API wrapper
 * Handles all room-related API calls
 */

// Base API URL utility
const getBaseUrl = () => {
  let url = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8081';
  url = url.replace(/\/$/, '');
  // If the URL already ends with /api, return it, otherwise append it
  return url.endsWith('/api') ? url : `${url}/api`;
};

const API_BASE_URL = getBaseUrl();


/**
 * Room Type enum matching backend
 */
export enum RoomType {
  ANNOUNCEMENT = 'ANNOUNCEMENT',
  GENERAL = 'GENERAL',
  VOICE_CHAT = 'VOICE_CHAT',
  POSTS = 'POSTS',
  VS_BATTLE = 'VS_BATTLE',
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
  activeUsers?: number;
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
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/rooms/${communityId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create room: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    // Backend returns { success, data: RoomDto }
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Invalid response from server');
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
    const response = await fetch(`${API_BASE_URL}/rooms/community/${communityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch community rooms: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // Backend returns { success, message, data: RoomDto[] }
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching community rooms:', error);
    return [];
  }
};

/**
 * Deletes a room
 * @param roomId - The ID of the room to delete
 * @returns Promise resolving to void
 * @throws Error if the API call fails
 */
export const deleteRoom = async (roomId: number): Promise<void> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to delete room: ${response.status} ${response.statusText} - ${errorText}`);
    }
  } catch (error) {
    console.error('Error deleting room:', error);
    throw error;
  }
};

/**
 * Updates a room
 * @param roomId - The ID of the room to update
 * @param data - Room update data
 * @returns Promise resolving to RoomDto
 * @throws Error if the API call fails
 */
export interface UpdateRoomRequest {
  name?: string;
  type?: RoomType;
  config?: string | null;
}

export const updateRoom = async (roomId: number, data: UpdateRoomRequest): Promise<RoomDto> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to update room: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const result = await response.json();
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Error updating room:', error);
    throw error;
  }
};

