import {
  addUserToRoom,
  removeUserFromRoom,
  getUsersInRoom,
} from "../services/presence.service.js";

export const registerPresenceSocket = (io, socket) => {
  const joinedRooms = new Set();

  socket.on("room:join", ({ roomId }) => {
    try {
      const rId = String(roomId);
      const userId = Number(socket.user.id);
      console.log(`[Presence] User ${userId} joined room ${rId} (page view)`);
      
      socket.join(`room:${rId}`);
      joinedRooms.add(rId);
      
      // Add to presence as "not in call" by default
      addUserToRoom(rId, { ...socket.user, id: userId, inCall: false });
      
      const usersInRoom = getUsersInRoom(rId);
      const presencePayload = {
        roomId: Number(rId),
        users: usersInRoom,
      };
      
      // Broadcast to all in room
      io.to(`room:${rId}`).emit("voice:presence", presencePayload);
      // Direct emit to the joining user to ensure they get it immediately
      socket.emit("voice:presence", presencePayload);
    } catch (err) {
      console.error("Error in room:join presence:", err);
    }
  });

  socket.on("disconnect", () => {
    const userId = Number(socket.user.id);
    joinedRooms.forEach(rId => {
      removeUserFromRoom(rId, userId);
      io.to(`room:${rId}`).emit("voice:presence", {
        roomId: Number(rId),
        users: getUsersInRoom(rId),
      });
    });
    joinedRooms.clear();
  });
};
