// roomId -> Map<userId, userInfo>
const roomPresenceMap = new Map();

export const addUserToRoom = (roomId, user) => {
  if (!roomPresenceMap.has(roomId)) {
    roomPresenceMap.set(roomId, new Map());
  }
  roomPresenceMap.get(roomId).set(user.id, {
    id: user.id,
    username: user.username,
    avatarUrl: user.avatarUrl || user.avatar || null
  });
};

export const removeUserFromRoom = (roomId, userId) => {
  if (!roomPresenceMap.has(roomId)) return;

  roomPresenceMap.get(roomId).delete(userId);

  if (roomPresenceMap.get(roomId).size === 0) {
    roomPresenceMap.delete(roomId);
  }
};

export const getUsersInRoom = (roomId) => {
  const usersMap = roomPresenceMap.get(roomId);
  if (!usersMap) return [];
  return Array.from(usersMap.values());
};
