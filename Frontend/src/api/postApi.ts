/**
 * Post API wrapper
 * Handles all post-related API calls
 * Currently placeholder endpoints until posts are fully implemented
 */

// Base API URL from environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';

/**
 * Post DTO (placeholder structure - will be updated when posts are fully implemented)
 */
export interface PostDto {
  id: number;
  mediaUrl: string;
  type: string;
  createdAt?: string;
  userId: number;
  roomId: number;
  user?: {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
  comments?: any[];
  likes?: any[];
  likeCount?: number;
  commentCount?: number;
}

/**
 * Fetches all posts for a specific user
 * @param userId - The ID of the user
 * @returns Promise resolving to array of PostDto
 * @throws Error if the API call fails
 */
export const getUserPosts = async (userId: number): Promise<PostDto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/posts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user posts: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // Backend returns { success, message, data: PostDto[] }
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user posts:', error);
    // Return empty array instead of throwing to prevent profile page crash
    return [];
  }
};

/**
 * Fetches recent posts for a specific user
 * @param userId - The ID of the user
 * @returns Promise resolving to array of PostDto
 * @throws Error if the API call fails
 */
export const getUserRecentPosts = async (userId: number): Promise<PostDto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/recent-posts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user recent posts: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    // Backend returns { success, message, data: PostDto[] }
    if (result.success && result.data) {
      return result.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching user recent posts:', error);
    // Return empty array instead of throwing to prevent profile page crash
    return [];
  }
};

