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
        console.log(`[Presence] User ${userId} (${user.username}) joining voice room ${rId}`);

        socket.join(`voice:${rId}`);
        socket.join(`room:${rId}`);
        
        joinedRooms.add(rId);
        addUserToRoom(rId, { ...user, id: userId });

        const usersInRoom = getUsersInRoom(rId);
        console.log(`[Presence] Room ${rId} full list:`, usersInRoom.map(u => `${u.username}(${u.id})`));

        // Emit to everyone in the room
        io.to(`room:${rId}`).emit("voice:presence", {
          roomId: Number(rId),
          users: usersInRoom,
        });

        // Explicitly emit to the sender to ensure they get the initial state even if room join takes a tick
        socket.emit("voice:presence", {
          roomId: Number(rId),
          users: usersInRoom,
        });
      } catch (err) {
        console.error("Error in voice:join:", err);
      }
    });

    socket.on("voice:leave", ({ roomId }) => {
      try {
        const rId = String(roomId);
        const userId = Number(socket.user.id);
        console.log(`[Presence] User ${userId} leaving voice room ${rId}`);

        socket.leave(`voice:${rId}`);
        joinedRooms.delete(rId);
        removeUserFromRoom(rId, userId);

        const usersInRoom = getUsersInRoom(rId);
        console.log(`[Presence] Room ${rId} now has ${usersInRoom.length} users`);

        io.to(`room:${rId}`).emit("voice:presence", {
          roomId: Number(rId),
          users: usersInRoom,
        });
      } catch (err) {
        console.error("Error in voice:leave:", err);
      }
    });

    socket.on("voice:signal", ({ to, signal, roomId }) => {
      try {
        const rId = String(roomId);
        const fromId = Number(socket.user.id);
        const targetId = Number(to);
        
        console.log(`[Presence] Signaling from ${fromId} to ${targetId} in room ${rId}`);
        
        io.to(`user:${targetId}`).emit("voice:signal", {
          from: fromId,
          signal,
          roomId: Number(rId)
        });
      } catch (err) {
        console.error("Error in voice:signal:", err);
      }
    });

    socket.on("voice:mute", ({ roomId, isMuted }) => {
      try {
        const rId = String(roomId);
        const userId = Number(socket.user.id);
        console.log(`[Presence] User ${userId} mute status in room ${rId}: ${isMuted}`);
        io.to(`room:${rId}`).emit("voice:mute", {
          roomId: Number(rId),
          userId,
          isMuted
        });
      } catch (err) {
        console.error("Error in voice:mute:", err);
      }
    });

    const myUserId = Number(socket.user.id);
    socket.join(`user:${myUserId}`);
    console.log(`[Presence] Socket ${socket.id} joined user:${myUserId}`);

    socket.on("disconnect", () => {
      const userId = Number(socket.user.id);
      console.log(`[Presence] User ${userId} disconnected, cleaning up ${joinedRooms.size} rooms`);
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
