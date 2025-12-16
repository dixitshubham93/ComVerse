import { prisma } from "../config/db.js";

export const saveMessage = async ({
  roomId,
  userId,
  content,
  contentType,
}) => {
  return prisma.message.create({
    data: {
      roomId,
      userId,
      content,
      contentType,
      createdAt: new Date(),
    },
  });
};

export const getMessagesByRoom = async (
  roomId,
  limit = 50,
  offset = 0
) => {
  return prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: {
      user: true,
    },
  });
};
