// src/services/presence.service.js

// roomId -> Map<userId, userInfo>
const roomPresenceMap = new Map();

export const addUserToRoom = (roomId, user, socketId = null) => {
  const rId = String(roomId);
  if (!roomPresenceMap.has(rId)) {
    roomPresenceMap.set(rId, new Map());
  }
  
  const userId = Number(user.id);
  const existing = roomPresenceMap.get(rId).get(userId) || {};
  
  const userInfo = {
    id: userId,
    username: user.username,
    avatarUrl: user.avatarUrl || user.avatar || null,
    inCall: user.inCall !== undefined ? user.inCall : (existing.inCall || false),
    socketId: socketId || existing.socketId || null
  };
  
  roomPresenceMap.get(rId).set(userId, userInfo);
  console.log(`[Presence Service] Added/Updated user ${userId} (${user.username}) in room ${rId}. inCall: ${userInfo.inCall}, socketId: ${userInfo.socketId}`);
};

export const updateUserCallStatus = (roomId, userId, inCall) => {
  const rId = String(roomId);
  const uId = Number(userId);
  
  if (!roomPresenceMap.has(rId)) {
    console.warn(`[Presence Service] Room ${rId} not found when updating call status`);
    return;
  }
  
  const user = roomPresenceMap.get(rId).get(uId);
  if (user) {
    user.inCall = inCall;
    console.log(`[Presence Service] Updated user ${uId} inCall status to ${inCall} in room ${rId}`);
  } else {
    console.warn(`[Presence Service] User ${uId} not found in room ${rId}`);
  }
};

export const removeUserFromRoom = (roomId, userId) => {
  const rId = String(roomId);
  const uId = Number(userId);
  if (!roomPresenceMap.has(rId)) return;

  const deleted = roomPresenceMap.get(rId).delete(uId);
  if (deleted) {
    console.log(`[Presence Service] Removed user ${uId} from room ${rId}`);
  }

  if (roomPresenceMap.get(rId).size === 0) {
    roomPresenceMap.delete(rId);
    console.log(`[Presence Service] Room ${rId} is now empty, removed from map`);
  }
};

export const getUsersInRoom = (roomId) => {
  const rId = String(roomId);
  const usersMap = roomPresenceMap.get(rId);
  if (!usersMap) return [];
  return Array.from(usersMap.values());
};

export const getUserInRoom = (roomId, userId) => {
  const rId = String(roomId);
  const uId = Number(userId);
  const usersMap = roomPresenceMap.get(rId);
  if (!usersMap) return null;
  return usersMap.get(uId) || null;
};