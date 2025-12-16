import { prisma } from "../config/db.js";

export const saveDM = async ({ senderId, receiverId, content }) => {
  return prisma.directMessage.create({
    data: {
      senderId,
      receiverId,
      content,
      createdAt: new Date(),
      read: false,
    },
  });
};

export const getDMHistory = async ({
  userId,
  otherUserId,
  limit = 50,
  offset = 0,
}) => {
  return prisma.directMessage.findMany({
    where: {
      OR: [
        { senderId: userId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: userId },
      ],
    },
    orderBy: { createdAt: "asc" },
    take: limit,
    skip: offset,
  });
};

export const markDMsAsRead = async ({ senderId, receiverId }) => {
  return prisma.directMessage.updateMany({
    where: {
      senderId,
      receiverId,
      read: false,
    },
    data: { read: true },
  });
};
