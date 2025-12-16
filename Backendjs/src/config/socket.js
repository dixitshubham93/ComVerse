import { Server } from "socket.io";
import { socketAuth } from "../middlewares/socketAuth.middleware.js";
import { registerMessageSocket } from "../sockets/message.socket.js";
import { registerDMSocket } from "../sockets/dm.socket.js";
import { registerPresenceSocket } from "../sockets/presence.socket.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: { origin: "*" },
  });

  // 🔐 authenticate ALL sockets
  io.use(socketAuth);

  io.on("connection", (socket) => {
    registerMessageSocket(io, socket);
    registerDMSocket(io, socket);
    registerPresenceSocket(io, socket);
  });
};
