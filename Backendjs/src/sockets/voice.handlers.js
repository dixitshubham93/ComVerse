// src/sockets/voice.handlers.js
import { 
  getUsersInRoom, 
  updateUserCallStatus,
  addUserToRoom,
  removeUserFromRoom
} from '../services/presence.service.js';

/**
 * Unified room and voice handlers.
 * Handles both general presence (who is in the room) and voice-specific state.
 */
export const registerVoiceHandlers = (io, socket) => {
  // Track rooms this socket has joined
  const joinedRooms = new Set();
  const inVoiceRooms = new Set();

  // --- GENERAL ROOM PRESENCE ---

  const joinRoom = ({ roomId }) => {
    if (!socket.user || !roomId) return;
    
    const rId = String(roomId);
    const userId = Number(socket.user.id);
    
    console.log(`[Presence] User ${userId} (${socket.user.username}) joined room ${rId}`);
    
    socket.join(`room:${rId}`);
    joinedRooms.add(rId);
    
    // Add to presence as "not in call" by default
    addUserToRoom(rId, { 
      ...socket.user, 
      id: userId, 
      inCall: false 
    }, socket.id);
    
    broadcastPresence(rId);
  };

  const leaveRoom = ({ roomId }) => {
    if (!socket.user || !roomId) return;
    
    const rId = String(roomId);
    const userId = Number(socket.user.id);
    
    console.log(`[Presence] User ${userId} leaving room ${rId}`);
    
    socket.leave(`room:${rId}`);
    joinedRooms.delete(rId);
    inVoiceRooms.delete(rId);
    
    removeUserFromRoom(rId, userId);
    broadcastPresence(rId);
  };

  // --- VOICE CALL LOGIC ---

  const joinVoice = ({ roomId }) => {
    if (!socket.user || !roomId) return;
    
    const rId = String(roomId);
    const userId = Number(socket.user.id);
    
    console.log(`[Voice] User ${userId} joining voice in room ${rId}`);
    
    // Ensure they are in the socket room
    socket.join(`room:${rId}`);
    joinedRooms.add(rId);
    inVoiceRooms.add(rId);
    
    // Update presence with inCall: true
    addUserToRoom(rId, { 
      ...socket.user, 
      id: userId, 
      inCall: true 
    }, socket.id);
    
    broadcastPresence(rId);
  };

  const leaveVoice = ({ roomId }) => {
    if (!socket.user || !roomId) return;
    
    const rId = String(roomId);
    const userId = Number(socket.user.id);
    
    console.log(`[Voice] User ${userId} leaving voice in room ${rId}`);
    
    updateUserCallStatus(rId, userId, false);
    inVoiceRooms.delete(rId);
    
    broadcastPresence(rId);
  };

  const signalVoice = ({ roomId, to, signal }) => {
    if (!socket.user || !roomId || !to || !signal) return;
    
    const rId = String(roomId);
    const fromUserId = Number(socket.user.id);
    const toUserId = Number(to);
    
    const users = getUsersInRoom(rId);
    const targetUser = users.find(u => Number(u.id) === toUserId);
    
    if (targetUser && targetUser.socketId) {
      io.to(targetUser.socketId).emit('voice:signal', {
        roomId: Number(rId),
        from: fromUserId,
        signal
      });
    }
  };

  const muteVoice = ({ roomId, isMuted }) => {
    if (!socket.user || !roomId) return;
    
    const rId = String(roomId);
    const userId = Number(socket.user.id);
    
    io.to(`room:${rId}`).emit('voice:mute', {
        roomId: Number(rId),
        userId: userId,
        isMuted
      });
    };

    const speakingVoice = ({ roomId, isSpeaking }) => {
      if (!socket.user || !roomId) return;
      
      const rId = String(roomId);
      const userId = Number(socket.user.id);
      
      // Broadcast to everyone in the room except sender (optional, but broadcast to all is easier for UI sync)
      io.to(`room:${rId}`).emit('voice:speaking', {
        roomId: Number(rId),
        userId: userId,
        isSpeaking
      });
    };

    // --- UTILS ---


  const broadcastPresence = (rId) => {
    const users = getUsersInRoom(rId);
    io.to(`room:${rId}`).emit('voice:presence', { 
      roomId: Number(rId), 
      users 
    });
  };

  const handleDisconnect = () => {
    if (!socket.user) return;
    const userId = Number(socket.user.id);
    
    joinedRooms.forEach(rId => {
      console.log(`[Presence] Cleaning up user ${userId} from room ${rId} on disconnect`);
      removeUserFromRoom(rId, userId);
      broadcastPresence(rId);
    });
    
    joinedRooms.clear();
    inVoiceRooms.clear();
  };

  // Bind events
  socket.on('room:join', joinRoom);
  socket.on('room:leave', leaveRoom);
  socket.on('voice:join', joinVoice);
  socket.on('voice:leave', leaveVoice);
    socket.on('voice:signal', signalVoice);
    socket.on('voice:mute', muteVoice);
    socket.on('voice:speaking', speakingVoice);
    socket.on('disconnect', handleDisconnect);

};
