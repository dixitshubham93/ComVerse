/**
 * Community API wrapper
 * Handles all community-related API calls
 */

// Base API URL from environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8081';

/**
 * Community Type Enum
 */
export enum CommunityType {
  GAMING = 'GAMING',
  ART = 'ART',
  MUSIC = 'MUSIC',
  TECHNOLOGY = 'TECHNOLOGY',
  SPORTS = 'SPORTS',
  FINANCE = 'FINANCE',
  LIFESTYLE = 'LIFESTYLE',
  TRAVEL = 'TRAVEL',
  EDUCATION = 'EDUCATION',
  OTHER = 'OTHER',
}

/**
 * Membership Role Enum
 */
export enum MembershipRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MODERATOR = 'MODERATOR',
  MEMBER = 'MEMBER',
}

/**
 * Community DTO
 */
export interface CommunityDto {
  id: number;
  name: string;
  description: string | null;
  bannerUrl: string | null;
  type: string;
}

/**
 * Create Community Request DTO
 */
export interface CreateCommunityRequest {
  name: string;
  description?: string;
  bannerUrl?: string;
  type: string;
}

/**
 * Creates a new community
 * @param data - Community creation data
 * @param creatorUserId - The ID of the user creating the community
 * @returns Promise resolving to CommunityDto
 * @throws Error if the API call fails
 */
export const createCommunity = async (
  data: CreateCommunityRequest,
  creatorUserId: number
): Promise<CommunityDto> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/communities`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Failed to create community: ${response.status} ${response.statusText}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error creating community:', error);
    throw error;
  }
};

/**
 * Gets all communities
 * @returns Promise resolving to array of CommunityDto
 * @throws Error if the API call fails
 */
export const getAllCommunities = async (): Promise<CommunityDto[]> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/communities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Failed to fetch communities: ${response.status} ${response.statusText}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching all communities:', error);
    throw error;
  }
};

/**
 * Gets a community by ID
 * @param id - The community ID
 * @returns Promise resolving to CommunityDto
 * @throws Error if the API call fails
 */
export const getCommunityById = async (id: number): Promise<CommunityDto> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/communities/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Failed to fetch community: ${response.status} ${response.statusText}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching community by ID:', error);
    throw error;
  }
};

/**
 * Community Stats DTO
 */
export interface CommunityStatsDto {
  totalMembers: number;
  activeMembers: number;
}

/**
 * Gets community statistics
 * @param id - The community ID
 * @returns Promise resolving to CommunityStatsDto
 * @throws Error if the API call fails
 */
export const getCommunityStats = async (id: number): Promise<CommunityStatsDto> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/communities/${id}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Failed to fetch community stats: ${response.status} ${response.statusText}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching community stats:', error);
    throw error;
  }
};

/**
 * Deletes a community
 * @param id - The community ID
 * @returns Promise resolving to success message
 * @throws Error if the API call fails
 */
export const deleteCommunity = async (id: number): Promise<{ message: string }> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/communities/${id}`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Failed to delete community: ${response.status} ${response.statusText}`);
    }

    return result.data;
  } catch (error) {
    console.error('Error deleting community:', error);
    throw error;
  }
};


export const parseCommunityType = (type: string): CommunityType => {
  if (Object.values(CommunityType).includes(type as CommunityType)) {
    return type as CommunityType;
  }
  return CommunityType.OTHER;
};
