/**
 * User API wrapper
 * Handles all user-related API calls
 */

// Base API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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
    const response = await fetch(`${API_BASE_URL}/api/users`, {
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
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user: ${response.status} ${response.statusText}`);
    }

    const userData: UserDto = await response.json();
    return userData;
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
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/communities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user communities: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user communities:', error);
    throw error;
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
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/communities/details`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user communities: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user communities with details:', error);
    throw error;
  }
};

