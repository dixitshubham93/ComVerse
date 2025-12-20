import {
  addUserToRoom,
  removeUserFromRoom,
  getUsersInRoom,
} from "../services/presence.service.js";

export const registerPresenceSocket = (io, socket) => {
  // Track joined rooms to cleanup on disconnect
  const joinedRooms = new Set();

  socket.on("voice:join", ({ roomId }) => {
    const user = socket.user;

    socket.join(`voice:${roomId}`);
    joinedRooms.add(roomId);
    addUserToRoom(roomId, user);

    io.to(`voice:${roomId}`).emit("voice:presence", {
      roomId,
      users: getUsersInRoom(roomId),
    });
  });

  socket.on("voice:leave", ({ roomId }) => {
    const userId = socket.user.id;

    socket.leave(`voice:${roomId}`);
    joinedRooms.delete(roomId);
    removeUserFromRoom(roomId, userId);

    io.to(`voice:${roomId}`).emit("voice:presence", {
      roomId,
      users: getUsersInRoom(roomId),
    });
  });

  socket.on("voice:signal", ({ to, signal, roomId }) => {
    const from = socket.user.id;
    // Send signal to specific user in the room
    io.to(`user:${to}`).emit("voice:signal", {
      from,
      signal,
      roomId
    });
  });

  // Make sure user is in their own room for targeted signaling
  socket.join(`user:${socket.user.id}`);

  socket.on("disconnect", () => {
    joinedRooms.forEach(roomId => {
      removeUserFromRoom(roomId, socket.user.id);
      io.to(`voice:${roomId}`).emit("voice:presence", {
        roomId,
        users: getUsersInRoom(roomId),
      });
    });
    joinedRooms.clear();
  });
};
