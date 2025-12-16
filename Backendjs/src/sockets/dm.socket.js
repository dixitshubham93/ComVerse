import { saveDM } from "../services/dm.service.js";

export const registerDMSocket = (io, socket) => {

  socket.on("dm:join", () => {
    socket.join(`dm:${socket.user.id}`);
  });

  socket.on("dm:send", async ({ receiverId, content }) => {
    try {
      const senderId = socket.user.id;

      const message = await saveDM({
        senderId,
        receiverId: BigInt(receiverId),
        content,
      });

      io.to(`dm:${receiverId}`).emit("dm:receive", {
        id: message.id,
        senderId,
        receiverId,
        content,
        createdAt: message.createdAt,
        read: false,
      });

      io.to(`dm:${senderId}`).emit("dm:sent", {
        id: message.id,
        senderId,
        receiverId,
        content,
        createdAt: message.createdAt,
        read: false,
      });

    } catch (err) {
      socket.emit("dm:error", { message: err.message });
    }
  });
};
