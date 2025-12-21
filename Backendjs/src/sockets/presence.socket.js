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
        const userId = Number(user.id);

        socket.join(`voice:${rId}`);
        socket.join(`room:${rId}`);
        
        joinedRooms.add(rId);
        addUserToRoom(rId, { ...user, id: userId });

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
        const userId = Number(socket.user.id);

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
      const fromId = Number(socket.user.id);
      io.to(`user:${to}`).emit("voice:signal", {
        from: fromId,
        signal,
        roomId: rId
      });
    });

    socket.on("voice:mute", ({ roomId, isMuted }) => {
      try {
        const rId = String(roomId);
        const userId = Number(socket.user.id);
        io.to(`room:${rId}`).emit("voice:mute", {
          roomId: rId,
          userId,
          isMuted
        });
      } catch (err) {
        console.error("Error in voice:mute:", err);
      }
    });

    socket.join(`user:${Number(socket.user.id)}`);

    socket.on("disconnect", () => {
      const userId = Number(socket.user.id);
      joinedRooms.forEach(rId => {
        removeUserFromRoom(rId, userId);
        io.to(`room:${rId}`).emit("voice:presence", {
          roomId: rId,
          users: getUsersInRoom(rId),
        });
      });
      joinedRooms.clear();
    });
};
