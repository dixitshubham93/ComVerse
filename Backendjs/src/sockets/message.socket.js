import { prisma } from "../config/db.js";
import { saveMessage } from "../services/message.service.js";

export const registerMessageSocket = (io, socket) => {

  socket.on("room:join", ({ roomId }) => {
    socket.join(`room:${roomId}`);
  });

  socket.on("room:message", async ({ roomId, content, contentType }) => {
    try {
      const userId = socket.user.id;

      const room = await prisma.room.findUnique({
        where: { id: BigInt(roomId) },
      });

      if (!room) {
        socket.emit("room:error", { message: "Room not found" });
        return;
      }

      // permissions (Java parity)
      if (room.locked || room.readOnly) {
        socket.emit("room:error", { message: "Room is not writable" });
        return;
      }

      if (room.adminOnly) {
        const membership = await prisma.membership.findFirst({
          where: {
            userId,
            communityId: room.communityId,
          },
        });

        if (!membership || membership.role === "MEMBER") {
          socket.emit("room:error", { message: "Admin only room" });
          return;
        }
      }

      const message = await saveMessage({
        roomId: BigInt(roomId),
        userId,
        content,
        contentType,
      });

      io.to(`room:${roomId}`).emit("room:message", {
        id: message.id,
        roomId,
        userId,
        content,
        contentType,
        createdAt: message.createdAt,
      });

    } catch (err) {
      socket.emit("room:error", { message: err.message });
    }
  });
};
