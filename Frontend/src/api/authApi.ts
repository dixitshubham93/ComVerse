/**
 * Auth API wrapper
 * Handles all authentication-related API calls
 */

// Base API URL from environment variable
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

/**
 * API Response structure matching backend
 */
export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string>;
}

/**
 * Signup Request DTO
 */
export interface SignupRequest {
  username: string;
  email: string;
  password: string;
  avatarUrl?: string;
  bannerUrl?: string;
  age?: number;
}

/**
 * Login Request DTO
 */
export interface LoginRequest {
  email: string;
  password: string;
}

/**
 * User DTO from backend
 */
export interface UserDto {
  id: number;
  username: string;
  email: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  age: number | null;
}

/**
 * Signs up a new user
 * @param data - Signup data
 * @returns Promise resolving to ApiResponse with UserDto
 * @throws Error if the API call fails
 */
export const signup = async (data: SignupRequest): Promise<ApiResponse<UserDto>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<UserDto> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Failed to sign up: ${response.status} ${response.statusText}`);
    }

    return result;
  } catch (error) {
    console.error('Error signing up:', error);
    throw error;
  }
};

/**
 * Logs in a user
 * @param data - Login credentials
 * @returns Promise resolving to ApiResponse with UserDto
 * @throws Error if the API call fails
 */
export const login = async (data: LoginRequest): Promise<ApiResponse<UserDto>> => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result: ApiResponse<UserDto> = await response.json();

    if (!response.ok || !result.success) {
      throw new Error(result.message || `Failed to log in: ${response.status} ${response.statusText}`);
    }

    return result;
  } catch (error) {
    console.error('Error logging in:', error);
    throw error;
  }
};

