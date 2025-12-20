import {
  addUserToRoom,
  removeUserFromRoom,
  getUsersInRoom,
} from "../services/presence.service.js";

export const registerPresenceSocket = (io, socket) => {
  const joinedRooms = new Set();

  socket.on("voice:join", ({ roomId }) => {
    try {
      const user = socket.user;
      const rId = String(roomId);

      socket.join(`voice:${rId}`);
      socket.join(`room:${rId}`);
      
      joinedRooms.add(rId);
      addUserToRoom(rId, user);

      io.to(`room:${rId}`).emit("voice:presence", {
        roomId: rId,
        users: getUsersInRoom(rId),
      });
    } catch (err) {
      console.error("Error in voice:join:", err);
    }
  });

  socket.on("voice:leave", ({ roomId }) => {
    try {
      const rId = String(roomId);
      const userId = socket.user.id;

      socket.leave(`voice:${rId}`);
      joinedRooms.delete(rId);
      removeUserFromRoom(rId, userId);

      io.to(`room:${rId}`).emit("voice:presence", {
        roomId: rId,
        users: getUsersInRoom(rId),
      });
    } catch (err) {
      console.error("Error in voice:leave:", err);
    }
  });

  socket.on("voice:signal", ({ to, signal, roomId }) => {
    const rId = String(roomId);
    io.to(`user:${to}`).emit("voice:signal", {
      from: Number(socket.user.id),
      signal,
      roomId: rId
    });
  });

  socket.join(`user:${socket.user.id}`);

  socket.on("disconnect", () => {
    joinedRooms.forEach(rId => {
      removeUserFromRoom(rId, socket.user.id);
      io.to(`room:${rId}`).emit("voice:presence", {
        roomId: rId,
        users: getUsersInRoom(rId),
      });
    });
    joinedRooms.clear();
  });
};
