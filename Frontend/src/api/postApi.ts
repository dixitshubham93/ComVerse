const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080';

export interface PostDto {
  id: number;
  mediaUrl: string;
  caption: string | null;
  type: 'IMAGE' | 'VIDEO';
  createdAt?: string;
  userId: number;
  roomId: number;
  user?: {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
  comments?: CommentDto[];
  likes?: LikeDto[];
  likeCount: number;
  commentCount: number;
}

export interface CommentDto {
  id: number;
  content: string;
  createdAt?: string;
  postId: number;
  userId: number;
  user?: {
    id: number;
    username: string;
    email: string;
    avatarUrl: string | null;
  };
}

export interface LikeDto {
  id: number;
  postId: number;
  userId: number;
}

const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

const getAuthHeaders = (): Record<string, string> => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export const getPostsByRoom = async (roomId: number): Promise<PostDto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/${roomId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.status}`);
    }

    const result = await response.json();
    return result.posts || [];
  } catch (error) {
    console.error('Error fetching posts:', error);
    return [];
  }
};

export const createPost = async (
  roomId: number,
  data: { mediaUrl: string; caption?: string; type?: 'IMAGE' | 'VIDEO' }
): Promise<PostDto | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/${roomId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({
        mediaUrl: data.mediaUrl,
        caption: data.caption || null,
        type: data.type || 'IMAGE',
      }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create post: ${response.status}`);
    }

    const result = await response.json();
    return result.post || null;
  } catch (error) {
    console.error('Error creating post:', error);
    return null;
  }
};

export const likePost = async (postId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/like/${postId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });

    return response.ok;
  } catch (error) {
    console.error('Error liking post:', error);
    return false;
  }
};

export const unlikePost = async (postId: number): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/like/${postId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    return response.ok;
  } catch (error) {
    console.error('Error unliking post:', error);
    return false;
  }
};

export const getComments = async (postId: number): Promise<CommentDto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/comment/${postId}`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch comments: ${response.status}`);
    }

    const result = await response.json();
    return result.comments || [];
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
};

export const createComment = async (
  postId: number,
  content: string
): Promise<CommentDto | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/posts/comment/${postId}`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      throw new Error(`Failed to create comment: ${response.status}`);
    }

    const result = await response.json();
    return result.comment || null;
  } catch (error) {
    console.error('Error creating comment:', error);
    return null;
  }
};

export const getUserPosts = async (userId: number): Promise<PostDto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/posts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user posts: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching user posts:', error);
    return [];
  }
};

export const getUserRecentPosts = async (userId: number): Promise<PostDto[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/users/${userId}/recent-posts`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch user recent posts: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('Error fetching user recent posts:', error);
    return [];
  }
};
