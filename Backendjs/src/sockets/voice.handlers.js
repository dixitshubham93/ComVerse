// src/sockets/voice.handlers.js
import { 
  getUsersInRoom, 
  updateUserCallStatus,
  addUserToRoom,
  removeUserFromRoom
} from '../services/presence.service.js';

export const registerVoiceHandlers = (io, socket) => {
  const joinedVoiceRooms = new Set();
  
  const joinVoice = ({ roomId }) => {
    if (!socket.user || !roomId) {
      console.error('[Voice] Missing user or roomId in voice:join');
      return;
    }
    
    const rId = String(roomId);
    const userId = Number(socket.user.id);
    
    console.log(`[Voice] User ${userId} (${socket.user.username}) joining voice in room ${rId}`);
    
    // Ensure user is in the Socket.IO room for broadcasting
    socket.join(`room:${rId}`);
    joinedVoiceRooms.add(rId);
    
    // Add/Update user in presence store with current socketId
    addUserToRoom(rId, { 
      ...socket.user, 
      id: userId, 
      inCall: true 
    }, socket.id);
    
    // Broadcast updated presence to everyone in the room
    const users = getUsersInRoom(rId);
    console.log(`[Voice] Broadcasting presence update. Users in room:`, users.length);
    
    io.to(`room:${rId}`).emit('voice:presence', { 
      roomId: Number(rId), 
      users 
    });
  };

  const leaveVoice = ({ roomId }) => {
    if (!socket.user || !roomId) {
      console.error('[Voice] Missing user or roomId in voice:leave');
      return;
    }
    
    const rId = String(roomId);
    const userId = Number(socket.user.id);
    
    console.log(`[Voice] User ${userId} (${socket.user.username}) leaving voice in room ${rId}`);
    
    // Update user to be "not in call"
    updateUserCallStatus(rId, userId, false);
    joinedVoiceRooms.delete(rId);
    
    // Broadcast updated presence
    const users = getUsersInRoom(rId);
    console.log(`[Voice] Broadcasting presence update after leave. Users in room:`, users.length);
    
    io.to(`room:${rId}`).emit('voice:presence', { 
      roomId: Number(rId), 
      users 
    });
  };

  const signalVoice = ({ roomId, to, signal }) => {
    if (!socket.user || !roomId || !to || !signal) {
      console.error('[Voice] Missing params in voice:signal');
      return;
    }
    
    const rId = String(roomId);
    const fromUserId = Number(socket.user.id);
    const toUserId = Number(to);
    
    // Find the target user's socket
    const users = getUsersInRoom(rId);
    // Relaxed check: just check if user exists and has a socketId. 
    // Handshake should proceed if they are in the room.
    const targetUser = users.find(u => Number(u.id) === toUserId);
    
    if (targetUser && targetUser.socketId) {
      io.to(targetUser.socketId).emit('voice:signal', {
        roomId: Number(rId),
        from: fromUserId,
        signal
      });
      console.log(`[Voice] Signal relayed from ${fromUserId} to ${toUserId} (socket: ${targetUser.socketId})`);
    } else {
      console.warn(`[Voice] Target user ${toUserId} not found or has no socketId in room ${rId}`);
    }
  };

  const muteVoice = ({ roomId, isMuted }) => {
    if (!socket.user || !roomId) {
      return;
    }
    
    const rId = String(roomId);
    const userId = Number(socket.user.id);
    
    io.to(`room:${rId}`).emit('voice:mute', {
      roomId: Number(rId),
      userId: userId,
      isMuted
    });
  };

  const handleDisconnect = () => {
    if (!socket.user) return;
    const userId = Number(socket.user.id);
    
    joinedVoiceRooms.forEach(rId => {
      console.log(`[Voice] Cleaning up user ${userId} from room ${rId} on disconnect`);
      removeUserFromRoom(rId, userId);
      
      const users = getUsersInRoom(rId);
      io.to(`room:${rId}`).emit('voice:presence', { 
        roomId: Number(rId), 
        users 
      });
    });
    joinedVoiceRooms.clear();
  };

  socket.on('voice:join', joinVoice);
  socket.on('voice:leave', leaveVoice);
  socket.on('voice:signal', signalVoice);
  socket.on('voice:mute', muteVoice);
  socket.on('disconnect', handleDisconnect);
};