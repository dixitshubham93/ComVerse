import { Server } from "socket.io";
import { socketAuth } from "../middlewares/socketAuth.middleware.js";
import { registerVoiceHandlers } from "../sockets/voice.handlers.js";
import { registerPresenceSocket } from "../sockets/presence.sockets.js";
import { registerMessageSocket } from "../sockets/message.socket.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:3001'],
      credentials: true,
      methods: ['GET', 'POST'],
    },
    transports: ['websocket', 'polling'],
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Use the central socket authentication middleware
  io.use(socketAuth);

    io.on('connection', (socket) => {
      console.log(`[Socket] Client connected: ${socket.id} - User: ${socket.user?.username} (${socket.user?.id})`);

      // Register all socket handlers
      registerVoiceHandlers(io, socket);
      registerMessageSocket(io, socket);

      socket.on('error', (error) => {
      console.error(`[Socket] Error for ${socket.id}:`, error);
      socket.emit('room:error', { message: error.message });
    });

    socket.on('disconnect', (reason) => {
      console.log(`[Socket] Client disconnected: ${socket.id} - User: ${socket.user?.username} - Reason: ${reason}`);
    });
  });

  return io;
};
