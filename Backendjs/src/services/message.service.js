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
  // First get the room to know its communityId
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { communityId: true }
  });

  if (!room) return [];

  return prisma.message.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    take: limit,
    skip: offset,
    include: {
      user: {
        include: {
          memberships: {
            where: { communityId: room.communityId }
          }
        }
      },
    },
  });
};

export const createNewMessage = async ({ roomId, userId, content, contentType }) => {
  // First get the room to know its communityId
  const room = await prisma.room.findUnique({
    where: { id: roomId },
    select: { communityId: true }
  });

  return prisma.message.create({
    data: {
      roomId,
      userId,
      content,
      contentType: contentType || null,
      createdAt: new Date(),
    },
    include: {
      user: {
        include: {
          memberships: {
            where: { communityId: room ? room.communityId : BigInt(0) }
          }
        }
      },
    },
  });
};
