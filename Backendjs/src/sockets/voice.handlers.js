// src/sockets/voice.handlers.js
import { 
  getUsersInRoom, 
  updateUserCallStatus 
} from '../services/presence.service.js';

export const registerVoiceHandlers = (io, socket) => {
  const joinVoice = ({ roomId }) => {
    if (!socket.user || !roomId) {
      console.error('[Voice] Missing user or roomId in voice:join');
      return;
    }
    
    const rId = String(roomId);
    const userId = Number(socket.user.id);
    
    console.log(`[Voice] User ${userId} (${socket.user.username}) joining voice in room ${rId}`);
    
    // Update user to be "in call"
    updateUserCallStatus(rId, userId, true);
    
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
    
    console.log(`[Voice] Relaying signal from ${fromUserId} to ${toUserId} in room ${rId}`);
    
    // Find the target user's socket
    const users = getUsersInRoom(rId);
    const targetUser = users.find(u => Number(u.id) === toUserId && u.inCall);
    
    if (targetUser && targetUser.socketId) {
      io.to(targetUser.socketId).emit('voice:signal', {
        roomId: Number(rId),
        from: fromUserId,
        signal
      });
      console.log(`[Voice] Signal sent to socket ${targetUser.socketId}`);
    } else {
      console.warn(`[Voice] Target user ${toUserId} not found or not in call`);
    }
  };

  const muteVoice = ({ roomId, isMuted }) => {
    if (!socket.user || !roomId) {
      console.error('[Voice] Missing params in voice:mute');
      return;
    }
    
    const rId = String(roomId);
    const userId = Number(socket.user.id);
    
    console.log(`[Voice] User ${userId} mute status: ${isMuted} in room ${rId}`);
    
    io.to(`room:${rId}`).emit('voice:mute', {
      roomId: Number(rId),
      userId: userId,
      isMuted
    });
  };

  socket.on('voice:join', joinVoice);
  socket.on('voice:leave', leaveVoice);
  socket.on('voice:signal', signalVoice);
  socket.on('voice:mute', muteVoice);
};