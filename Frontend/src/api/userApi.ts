/**
 * User API wrapper
 * Handles all user-related API calls
 */

// Base API URL from environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';


/**
 * User DTO matching backend structure
 */
export interface UserDto {
  id: number;
  username: string;
  email: string;
  password?: string; // Optional, not returned in responses
  avatarUrl: string | null;
  bannerUrl: string | null;
  age: number | null;
}

/**
 * Create User Request DTO
 */
export interface CreateUserRequest {
  username: string;
  email: string;
  password?: string; // Optional for now (no auth yet)
  avatarUrl: string;
  bannerUrl?: string;
  age: number;
}

/**
 * Creates a new user
 * @param data - User creation data
 * @returns Promise resolving to UserDto
 * @throws Error if the API call fails
 */
export const createUser = async (data: CreateUserRequest): Promise<UserDto> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to create user: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const userData: UserDto = await response.json();
    return userData;
  } catch (error) {
    console.error('Error creating user:', error);
    throw error;
  }
};

/**
 * Fetches a user by ID
 * @param id - The ID of the user
 * @returns Promise resolving to UserDto
 * @throws Error if the API call fails
 */
export const getUser = async (id: number): Promise<UserDto> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/users/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // Backend returns { success, message, data: UserDto }
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error(result.message || 'Failed to fetch user');
  } catch (error) {
    console.error('Error fetching user:', error);
    throw error;
  }
};

/**
 * Fetches communities for a specific user
 * @param userId - The ID of the user
 * @returns Promise resolving to array of CommunityDto
 * @throws Error if the API call fails
 */
export const getUserCommunities = async (userId: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/communities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user communities: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // Backend returns { success, message, data: CommunityDto[] }
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user communities:', error);
    // Return empty array to prevent crashes
    return [];
  }
};

/**
 * Fetches communities for a specific user with enhanced details (member count, user role)
 * @param userId - The ID of the user
 * @returns Promise resolving to array of UserCommunityDto
 * @throws Error if the API call fails
 */
export const getUserCommunitiesWithDetails = async (userId: number) => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/communities/details`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user communities: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // Backend returns { success, message, data: UserCommunityDto[] }
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user communities with details:', error);
    // Return empty array to prevent crashes
    return [];
  }
};

