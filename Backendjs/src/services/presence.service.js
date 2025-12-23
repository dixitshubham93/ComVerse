// roomId -> Map<userId, userInfo>
const roomPresenceMap = new Map();

export const addUserToRoom = (roomId, user) => {
  const rId = String(roomId);
  if (!roomPresenceMap.has(rId)) {
    roomPresenceMap.set(rId, new Map());
  }
  
  const userId = Number(user.id);
  const existing = roomPresenceMap.get(rId).get(userId) || {};
  
  roomPresenceMap.get(rId).set(userId, {
    id: userId,
    username: user.username,
    avatarUrl: user.avatarUrl || user.avatar || null,
    inCall: user.inCall !== undefined ? user.inCall : (existing.inCall || false)
  });
};

export const removeUserFromRoom = (roomId, userId) => {
  const rId = String(roomId);
  if (!roomPresenceMap.has(rId)) return;

  roomPresenceMap.get(rId).delete(Number(userId));

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
