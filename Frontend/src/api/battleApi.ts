const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:8080/api';

export interface BattleDto {
  id: string;
  status: string;
  createdAt: string;
  expiresAt: string | null;
  roomId: string;
  post1Id: string;
  post2Id: string;
  post1: any;
  post2: any;
  post1Votes: number;
  post2Votes: number;
}

export const createBattle = async (data: { roomId: string; post1Id: string; post2Id: string; expiresAt?: string }): Promise<BattleDto> => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/battles`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) throw new Error('Failed to create battle');
  const result = await response.json();
  return result.data;
};

export const getBattlesByRoom = async (roomId: string): Promise<BattleDto[]> => {
  const response = await fetch(`${API_BASE_URL}/battles/room/${roomId}`);
  if (!response.ok) throw new Error('Failed to fetch battles');
  const result = await response.json();
  return result.data;
};

export const voteInBattle = async (battleId: string, postId: string): Promise<any> => {
  const token = localStorage.getItem('authToken');
  const response = await fetch(`${API_BASE_URL}/battles/vote`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` }),
    },
    body: JSON.stringify({ battleId, postId }),
  });

  if (!response.ok) throw new Error('Failed to vote');
  return await response.json();
};
