/**
 * Membership API wrapper
 * Handles all membership-related API calls
 */

import { MembershipRole } from './communityApi';

// Base API URL from environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';


/**
 * Membership DTO matching backend structure
 */
export interface MembershipDto {
  id: number;
  userId: number;
  communityId: number;
  role: MembershipRole;
  joinedAt: string;
}

/**
 * Member info for display
 */
export interface MemberInfo {
  id: number;
  userId: number;
  username: string;
  avatarUrl: string | null;
  role: MembershipRole;
  joinedAt: string;
  isActive?: boolean;
}

/**
 * Check if user is a member of a community
 * @param userId - The ID of the user
 * @param communityId - The ID of the community
 * @returns Promise resolving to boolean
 */
export const checkMembership = async (userId: number, communityId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/memberships/check/${userId}/${communityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return false;
    }

    const result = await response.json();
    // Backend returns { success, data: boolean }
    if (result.success && typeof result.data === 'boolean') {
      return result.data;
    }
    return false;
  } catch (error) {
    console.error('Error checking membership:', error);
    return false;
  }
};

/**
 * Get user's role in a community
 * @param userId - The ID of the user
 * @param communityId - The ID of the community
 * @returns Promise resolving to MembershipRole or null if not a member
 */
export const getUserRole = async (userId: number, communityId: number): Promise<MembershipRole | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/memberships/role/${userId}/${communityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    // Backend returns { success, data: role }
    if (result.success && result.data) {
      return result.data;
    }
    return null;
  } catch (error) {
    console.error('Error getting user role:', error);
    return null;
  }
};

/**
 * Join a community
 * @param userId - The ID of the user
 * @param communityId - The ID of the community
 * @returns Promise resolving to MembershipDto
 */
export const joinCommunity = async (userId: number, communityId: number): Promise<MembershipDto> => {
  try {
    const token = localStorage.getItem('authToken');
    const response = await fetch(`${API_BASE_URL}/api/memberships/join/${communityId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to join community: ${response.status}`);
    }

    const result = await response.json();
    // Backend returns { success, data: MembershipDto }
    if (result.success && result.data) {
      return result.data;
    }
    throw new Error('Invalid response from server');
  } catch (error) {
    console.error('Error joining community:', error);
    throw error;
  }
};

/**
 * Leave a community
 * @param userId - The ID of the user
 * @param communityId - The ID of the community
 */
export const leaveCommunity = async (userId: number, communityId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/memberships/leave`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        communityId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to leave community: ${response.status}`);
    }
  } catch (error) {
    console.error('Error leaving community:', error);
    throw error;
  }
};

/**
 * Get all members of a community
 * @param communityId - The ID of the community
 * @returns Promise resolving to array of MemberInfo
 */
export const getCommunityMembers = async (communityId: number): Promise<MemberInfo[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/memberships/community/${communityId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch members: ${response.status}`);
    }

    const result = await response.json();
    // Backend returns { success, data: MembershipDto[] with user included }
    if (!result.success || !result.data) {
      return [];
    }

    const memberships = result.data;
    
    // Transform memberships to MemberInfo (backend already includes user data)
    const memberInfos: MemberInfo[] = memberships.map((membership: any) => ({
      id: membership.id,
      userId: membership.userId,
      username: membership.user?.username || 'Unknown',
      avatarUrl: membership.user?.avatarUrl || null,
      role: membership.role,
      joinedAt: membership.joinedAt,
      isActive: true, // TODO: Implement actual active status check
    }));

    return memberInfos;
  } catch (error) {
    console.error('Error fetching community members:', error);
    return [];
  }
};

/**
 * Kick a member from a community
 * @param userId - The ID of the user to kick
 * @param communityId - The ID of the community
 * @returns Promise resolving to void
 * @throws Error if the API call fails
 */
export const kickMember = async (userId: number, communityId: number): Promise<void> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/memberships/kick`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        communityId,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `Failed to kick member: ${response.status}`);
    }
  } catch (error) {
    console.error('Error kicking member:', error);
    throw error;
  }
};

