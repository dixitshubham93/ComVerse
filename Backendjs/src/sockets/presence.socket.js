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
        
        console.log(`[Presence] Emitted voice:presence to room:${rId} and user:${userId}. Total users: ${usersInRoom.length}`);
      } catch (err) {
        console.error("Error in room:join presence:", err);
      }
    });

    socket.on("voice:join", ({ roomId }) => {
      try {
        const user = socket.user;
        const rId = String(roomId);
        const userId = Number(user.id);
        console.log(`[Presence] User ${userId} (${user.username}) requesting to join voice room ${rId}`);

        socket.join(`voice:${rId}`);
        socket.join(`room:${rId}`); // Should already be joined but just in case
        
        joinedRooms.add(rId);
        // Mark as "in call"
        addUserToRoom(rId, { ...user, id: userId, inCall: true });

        const usersInRoom = getUsersInRoom(rId);
        console.log(`[Presence] Room ${rId} membership updated. New total: ${usersInRoom.length}`);

        const presencePayload = {
          roomId: Number(rId),
          users: usersInRoom,
        };
        
        io.to(`room:${rId}`).emit("voice:presence", presencePayload);
        socket.emit("voice:presence", presencePayload);
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
