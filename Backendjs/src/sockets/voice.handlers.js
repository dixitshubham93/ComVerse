import { voicePresence } from './voice.presence.js';

export const registerVoiceHandlers = (io, socket) => {
  const joinVoice = ({ roomId }) => {
    if (!socket.user || !roomId) return;
    const rId = roomId.toString();

    // Join room
    socket.join(rId);
    voicePresence.addUser(rId, socket.user, socket.id);

    // Broadcast presence update
    const users = voicePresence.getUsers(rId);
    io.to(rId).emit('voice:presence', { roomId: rId, users });
  };

  const leaveVoice = ({ roomId }) => {
    if (!socket.user || !roomId) return;
    const rId = roomId.toString();

    voicePresence.removeUser(rId, socket.user.id);
    socket.leave(rId);

    // Broadcast presence update
    const users = voicePresence.getUsers(rId);
    io.to(rId).emit('voice:presence', { roomId: rId, users });
  };

  const signalVoice = ({ roomId, to, signal }) => {
    if (!socket.user || !roomId || !to) return;
    const rId = roomId.toString();

    const roomUsers = voicePresence.getUsers(rId);
    const targetUser = roomUsers.find(u => u.id.toString() === to.toString());

    if (targetUser && targetUser.socketId) {
      io.to(targetUser.socketId).emit('voice:signal', {
        roomId: rId,
        from: socket.user.id.toString(),
        signal
      });
    }
  };

  const muteVoice = ({ roomId, isMuted }) => {
    if (!socket.user || !roomId) return;
    const rId = roomId.toString();

    io.to(rId).emit('voice:mute', {
      roomId: rId,
      userId: socket.user.id.toString(),
      isMuted
    });
  };

  const handleDisconnect = () => {
    const info = voicePresence.removeSocket(socket.id);
    if (info) {
      const { roomId } = info;
      const rId = roomId.toString();
      const users = voicePresence.getUsers(rId);
      io.to(rId).emit('voice:presence', { roomId: rId, users });
    }
  };

  socket.on('voice:join', joinVoice);
  socket.on('voice:leave', leaveVoice);
  socket.on('voice:signal', signalVoice);
  socket.on('voice:mute', muteVoice);
  socket.on('disconnect', handleDisconnect);
};
