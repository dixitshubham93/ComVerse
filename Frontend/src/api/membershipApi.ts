/**
 * Membership API wrapper
 * Handles all membership-related API calls
 */

import { MembershipRole } from './communityApi';

// Base API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

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

    const isMember: boolean = await response.json();
    return isMember;
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

    const role: MembershipRole = await response.json();
    return role;
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
    const response = await fetch(`${API_BASE_URL}/api/memberships/join`, {
      method: 'POST',
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
      throw new Error(errorData.message || `Failed to join community: ${response.status}`);
    }

    const data: MembershipDto = await response.json();
    return data;
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

    const memberships: MembershipDto[] = await response.json();
    
    // Fetch user details for each membership
    const memberInfos: MemberInfo[] = await Promise.all(
      memberships.map(async (membership) => {
        try {
          const userResponse = await fetch(`${API_BASE_URL}/api/users/${membership.userId}`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            },
          });

          if (!userResponse.ok) {
            return {
              id: membership.id,
              userId: membership.userId,
              username: 'Unknown',
              avatarUrl: null,
              role: membership.role,
              joinedAt: membership.joinedAt,
              isActive: false,
            };
          }

          const user = await userResponse.json();
          return {
            id: membership.id,
            userId: membership.userId,
            username: user.username,
            avatarUrl: user.avatarUrl,
            role: membership.role,
            joinedAt: membership.joinedAt,
            isActive: true, // TODO: Implement actual active status check
          };
        } catch (error) {
          console.error(`Error fetching user ${membership.userId}:`, error);
          return {
            id: membership.id,
            userId: membership.userId,
            username: 'Unknown',
            avatarUrl: null,
            role: membership.role,
            joinedAt: membership.joinedAt,
            isActive: false,
          };
        }
      })
    );

    return memberInfos;
  } catch (error) {
    console.error('Error fetching community members:', error);
    throw error;
  }
};

