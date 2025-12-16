// roomId -> Set<userId>
const roomPresenceMap = new Map();

export const addUserToRoom = (roomId, userId) => {
  if (!roomPresenceMap.has(roomId)) {
    roomPresenceMap.set(roomId, new Set());
  }
  roomPresenceMap.get(roomId).add(userId);
};

export const removeUserFromRoom = (roomId, userId) => {
  if (!roomPresenceMap.has(roomId)) return;

  roomPresenceMap.get(roomId).delete(userId);

  if (roomPresenceMap.get(roomId).size === 0) {
    roomPresenceMap.delete(roomId);
  }
};

export const getUsersInRoom = (roomId) => {
  return Array.from(roomPresenceMap.get(roomId) || []);
};
