/**
 * Authoritative Voice Presence Store
 * Map: roomId -> Map<userId, { socketId, user }>
 */
class VoicePresence {
  constructor() {
    this.rooms = new Map();
    this.socketToUser = new Map(); // socketId -> { userId, roomId }
  }

  addUser(roomId, user, socketId) {
    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Map());
    }
    const roomUsers = this.rooms.get(roomId);
    roomUsers.set(user.id.toString(), { 
      socketId, 
      ...user,
      inCall: true 
    });
    this.socketToUser.set(socketId, { userId: user.id.toString(), roomId });
  }

  removeUser(roomId, userId) {
    const uId = userId.toString();
    if (this.rooms.has(roomId)) {
      const roomUsers = this.rooms.get(roomId);
      roomUsers.delete(uId);
      if (roomUsers.size === 0) {
        this.rooms.delete(roomId);
      }
    }
  }

  removeSocket(socketId) {
    const info = this.socketToUser.get(socketId);
    if (info) {
      const { userId, roomId } = info;
      this.removeUser(roomId, userId);
      this.socketToUser.delete(socketId);
      return { userId, roomId };
    }
    return null;
  }

  getUsers(roomId) {
    if (!this.rooms.has(roomId)) return [];
    return Array.from(this.rooms.get(roomId).values());
  }
}

export const voicePresence = new VoicePresence();
