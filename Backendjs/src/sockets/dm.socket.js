import { saveDM } from "../services/dm.service.js";

export const registerDMSocket = (io, socket) => {

  socket.on("dm:join", () => {
    const userIdStr = socket.user.id.toString();
    socket.join(`dm:${userIdStr}`);
    console.log(`User ${userIdStr} joined DM room`);
  });

  socket.on("dm:send", async ({ receiverId, content }) => {
    try {
      const senderId = socket.user.id;
      const senderIdNum = Number(senderId);
      const receiverIdNum = Number(receiverId);

      const message = await saveDM({
        senderId,
        receiverId: BigInt(receiverId),
        content,
      });

      // Convert BigInt to Number for JSON serialization
      const serializedMessage = {
        id: Number(message.id),
        senderId: senderIdNum,
        receiverId: receiverIdNum,
        content,
        createdAt: message.createdAt.toISOString(),
        read: false,
      };

      // Emit to receiver
      io.to(`dm:${receiverId}`).emit("dm:receive", serializedMessage);

      // Emit confirmation to sender
      io.to(`dm:${senderId.toString()}`).emit("dm:sent", serializedMessage);

      console.log(`DM sent from ${senderIdNum} to ${receiverIdNum}`);

    } catch (err) {
      console.error('DM send error:', err);
      socket.emit("dm:error", { message: err.message });
    }
  });
};
