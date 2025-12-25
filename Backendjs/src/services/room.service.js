import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const createRoom = async ({
  communityId,
  name,
  type,
  config,
  isDefaultRoom,
  readOnly,
  adminOnly,
  locked,
}) => {
  const community = await prisma.community.findUnique({
    where: { id: communityId },
  });

  if (!community) throw new AppError("Community not found", 404);

  return prisma.room.create({
    data: {
      communityId,
      name,
      type,
      config,
      isDefaultRoom: isDefaultRoom ?? false,
      readOnly: readOnly ?? false,
      adminOnly: adminOnly ?? false,
      locked: locked ?? false,
      createdAt: new Date(),
    },
  });
};

export const getRoomsByCommunity = async (communityId) => {
  return prisma.room.findMany({
    where: { communityId },
    orderBy: { createdAt: "asc" },
  });
};

export const deleteRoom = async (roomId) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) throw new AppError("Room not found", 404);

  await prisma.room.delete({
    where: { id: roomId },
  });

  return { message: "Room deleted successfully" };
};

export const updateRoomService = async (roomId, data) => {
  const room = await prisma.room.findUnique({
    where: { id: roomId },
  });

  if (!room) throw new AppError("Room not found", 404);

    return prisma.room.update({
    where: { id: roomId },
    data: {
      ...data
    },
  });
};
