import {
  addUserToRoom,
  removeUserFromRoom,
  getUsersInRoom,
} from "../services/presence.service.js";

export const registerPresenceSocket = (io, socket) => {

  socket.on("voice:join", ({ roomId }) => {
    const userId = socket.user.id;

    socket.join(`voice:${roomId}`);
    addUserToRoom(roomId, userId);

    io.to(`voice:${roomId}`).emit("voice:presence", {
      roomId,
      users: getUsersInRoom(roomId),
    });
  });

    socket.on("voice:leave", ({ roomId }) => {
      const userId = socket.user.id;

      socket.leave(`voice:${roomId}`);
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
    // optional enhancement: track which rooms user was in
  });
};
