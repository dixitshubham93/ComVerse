// src/sockets/presence.sockets.js
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
      
      console.log(`[Presence] User ${userId} (${socket.user.username}) joined room ${rId} (socket: ${socket.id})`);
      
      // Join the Socket.IO room
      socket.join(`room:${rId}`);
      joinedRooms.add(rId);
      
      // Add to presence as "not in call" by default, but store the socket ID
      addUserToRoom(rId, { 
        ...socket.user, 
        id: userId, 
        inCall: false 
      }, socket.id);
      
      const usersInRoom = getUsersInRoom(rId);
      const presencePayload = {
        roomId: Number(rId),
        users: usersInRoom,
      };
      
      console.log(`[Presence] Broadcasting presence to room ${rId}. Users:`, usersInRoom.length);
      
      // Broadcast to all in room
      io.to(`room:${rId}`).emit("voice:presence", presencePayload);
    } catch (err) {
      console.error("[Presence] Error in room:join:", err);
      socket.emit('room:error', { message: err.message });
    }
  });

  socket.on("room:leave", ({ roomId }) => {
    try {
      const rId = String(roomId);
      const userId = Number(socket.user.id);
      
      console.log(`[Presence] User ${userId} leaving room ${rId}`);
      
      socket.leave(`room:${rId}`);
      joinedRooms.delete(rId);
      
      removeUserFromRoom(rId, userId);
      
      io.to(`room:${rId}`).emit("voice:presence", {
        roomId: Number(rId),
        users: getUsersInRoom(rId),
      });
    } catch (err) {
      console.error("[Presence] Error in room:leave:", err);
    }
  });

  socket.on("disconnect", () => {
    const userId = Number(socket.user.id);
    console.log(`[Presence] User ${userId} disconnected, cleaning up rooms:`, Array.from(joinedRooms));
    
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