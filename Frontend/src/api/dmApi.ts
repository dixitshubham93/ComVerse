/**
 * DM API wrapper
 * Handles all direct message-related API calls
 */

// Base API URL from environment variable
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('authToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

export interface DirectMessage {
  id: number;
  senderId: number;
  receiverId: number;
  content: string;
  createdAt: string;
  read: boolean;
}

export interface SendDMRequest {
  receiverId: string | bigint;
  content: string;
}

export interface GetDMHistoryParams {
  otherUserId: string | bigint;
  limit?: number;
  offset?: number;
}

/**
 * Get DM history between current user and another user
 */
export const getDMHistory = async ({
  otherUserId,
  limit = 50,
  offset = 0,
}: GetDMHistoryParams): Promise<DirectMessage[]> => {
  try {
    const headers = getAuthHeaders();
    console.log('DM API Request - Headers:', headers);
    console.log('DM API Request - URL:', `${API_BASE_URL}/dm/${otherUserId}?limit=${limit}&offset=${offset}`);
    
    const response = await fetch(`${API_BASE_URL}/dm/${otherUserId}?limit=${limit}&offset=${offset}`, {
      method: 'GET',
      headers: headers,
    });

    console.log('DM API Response - Status:', response.status);
    console.log('DM API Response - Status Text:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('DM API Response - Error Body:', errorText);
      throw new Error(`Failed to fetch DM history: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('DM API Response - Success:', result);
    return result.messages;
  } catch (error) {
    console.error('Error fetching DM history:', error);
    throw error;
  }
};

/**
 * Mark DMs as read
 */
export const markDMsAsRead = async (otherUserId: string | bigint): Promise<void> => {
  try {
    const headers = getAuthHeaders();
    console.log('Mark DMs as Read API Request - Headers:', headers);
    console.log('Mark DMs as Read API Request - URL:', `${API_BASE_URL}/dm/${otherUserId}/read`);
    
    const response = await fetch(`${API_BASE_URL}/dm/${otherUserId}/read`, {
      method: 'POST',
      headers: headers,
    });

    console.log('Mark DMs as Read API Response - Status:', response.status);
    console.log('Mark DMs as Read API Response - Status Text:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Mark DMs as Read API Response - Error Body:', errorText);
      throw new Error(`Failed to mark DMs as read: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Mark DMs as Read API Response - Success:', result);
  } catch (error) {
    console.error('Error marking DMs as read:', error);
    throw error;
  }
};

/**
 * Send a DM
 */
export const sendDM = async (
  receiverId: string | bigint,
  content: string
): Promise<DirectMessage> => {
  try {
    const headers = getAuthHeaders();
    console.log('Send DM API Request - Headers:', headers);
    console.log('Send DM API Request - URL:', `${API_BASE_URL}/dm/send`);
    console.log('Send DM API Request - Body:', JSON.stringify({
      receiverId: receiverId.toString(),
      content,
    }));
    
    const response = await fetch(`${API_BASE_URL}/dm/send`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify({
        receiverId: receiverId.toString(),
        content,
      }),
    });

    console.log('Send DM API Response - Status:', response.status);
    console.log('Send DM API Response - Status Text:', response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Send DM API Response - Error Body:', errorText);
      throw new Error(`Failed to send DM: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    console.log('Send DM API Response - Success:', result);
    return result.message;
  } catch (error) {
    console.error('Error sending DM:', error);
    throw error;
  }
};

