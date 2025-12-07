/**
 * Community API wrapper
 * Handles all community-related API calls
 */

// Base API URL from environment variable


const API_BASE_URL = 'http://localhost:8080';

/**
 * Community Type enum matching backend
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
 * Membership Role enum matching backend
 */
export enum MembershipRole {
  OWNER = 'OWNER',
  ADMIN = 'ADMIN',
  MEMBER = 'MEMBER',
}

/**
 * Community DTO matching backend structure
 */
export interface CommunityDto {
  id: number;
  name: string;
  description: string;
  bannerUrl: string | null;
  type: CommunityType;
}

/**
 * User Community DTO with enhanced details
 */
export interface UserCommunityDto {
  id: number;
  name: string;
  description: string;
  bannerUrl: string | null;
  type: CommunityType;
  memberCount: number;
  userRole: MembershipRole;
}

/**
 * Extended Community interface for frontend use
 * Includes additional properties needed for UI rendering
 */
export interface Community extends CommunityDto {
  // Additional frontend-only properties can be added here
  // For now, we'll use the DTO as-is and map additional properties in components
}

/**
 * Fetches all communities from the backend
 * @returns Promise resolving to array of CommunityDto
 * @throws Error if the API call fails
 */
export const getAllCommunities = async (): Promise<CommunityDto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/communities`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch communities: ${response.status} ${response.statusText}`);
    }

    const data: CommunityDto[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching all communities:', error);
    throw error;
  }
};

/**
 * User Profile DTO matching backend structure
 */
export interface UserProfileDto {
  id: number;
  username: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  age: number | null;
  communitiesJoined: CommunityDto[];
  communitiesCreated: CommunityDto[];
  posts: any[]; // PostDto[] - not needed for this module
}

/**
 * Fetches communities for a specific user
 * @param userId - The ID of the user
 * @returns Promise resolving to array of CommunityDto
 * @throws Error if the API call fails
 */
export const getUserCommunities = async (userId: number): Promise<CommunityDto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/profile`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user communities: ${response.status} ${response.statusText}`);
    }

    const userProfile: UserProfileDto = await response.json();
    return userProfile.communitiesJoined || [];
  } catch (error) {
    console.error('Error fetching user communities:', error);
    throw error;
  }
};

/**
 * Create Community Request DTO
 */
export interface CreateCommunityRequest {
  name: string;
  description: string;
  bannerUrl: string | null;
  type: CommunityType;
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
    const response = await fetch(`${API_BASE_URL}/api/communities?creatorUserId=${creatorUserId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const responseData = await response.json();

    if (!response.ok) {
      // Handle standardized API response format
      if (responseData.message) {
        throw new Error(responseData.message);
      }
      throw new Error(`Failed to create community: ${response.status} ${response.statusText}`);
    }

    // Backend may return CommunityDto directly or wrapped in ApiResponse
    if (responseData.data) {
      return responseData.data;
    }
    return responseData as CommunityDto;
  } catch (error) {
    console.error('Error creating community:', error);
    throw error;
  }
};

/**
 * Fetches a community by ID
 * @param id - The ID of the community
 * @returns Promise resolving to CommunityDto
 * @throws Error if the API call fails
 */
export const getCommunityById = async (id: number): Promise<CommunityDto> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/communities/${id}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch community: ${response.status} ${response.statusText}`);
    }

    const data: CommunityDto = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching community:', error);
    throw error;
  }
};

/**
 * Community Stats DTO
 */
export interface CommunityStatsDto {
  activeMembers: number;
  totalMembers: number;
}

/**
 * Fetches community statistics (active and total members)
 * @param id - The ID of the community
 * @returns Promise resolving to CommunityStatsDto
 * @throws Error if the API call fails
 */
export const getCommunityStats = async (id: number): Promise<CommunityStatsDto> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/communities/${id}/stats`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch community stats: ${response.status} ${response.statusText}`);
    }

    const data: CommunityStatsDto = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching community stats:', error);
    throw error;
  }
};

