/**
 * Post API wrapper
 * Handles all post-related API calls
 * Currently placeholder endpoints until posts are fully implemented
 */

// Base API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * Post DTO (placeholder structure - will be updated when posts are fully implemented)
 */
export interface PostDto {
  id: number;
  // Add more fields when posts are implemented
  [key: string]: any;
}

/**
 * Fetches all posts for a specific user
 * @param userId - The ID of the user
 * @returns Promise resolving to array of PostDto (empty for now)
 * @throws Error if the API call fails
 */
export const getUserPosts = async (userId: number): Promise<PostDto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/posts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user posts: ${response.status} ${response.statusText}`);
    }

    const data: PostDto[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user posts:', error);
    throw error;
  }
};

/**
 * Fetches recent posts for a specific user
 * @param userId - The ID of the user
 * @returns Promise resolving to array of PostDto (empty for now)
 * @throws Error if the API call fails
 */
export const getUserRecentPosts = async (userId: number): Promise<PostDto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/recent-posts`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user recent posts: ${response.status} ${response.statusText}`);
    }

    const data: PostDto[] = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user recent posts:', error);
    throw error;
  }
};

