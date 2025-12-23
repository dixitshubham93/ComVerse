// roomId -> Map<userId, userInfo>
const roomPresenceMap = new Map();

export const addUserToRoom = (roomId, user) => {
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
    inCall: user.inCall !== undefined ? user.inCall : (existing.inCall || false)
  };
  
  roomPresenceMap.get(rId).set(userId, userInfo);
  console.log(`[Presence Service] Added/Updated user ${userId} (${user.username}) in room ${rId}. inCall: ${userInfo.inCall}`);
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
  }
};

export const getUsersInRoom = (roomId) => {
  const rId = String(roomId);
  const usersMap = roomPresenceMap.get(rId);
  if (!usersMap) return [];
  return Array.from(usersMap.values());
};
