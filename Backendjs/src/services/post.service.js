import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const createPost = async ({
  roomId,
  userId,
  mediaUrl,
  type,
}) => {
  return prisma.post.create({
    data: {
      roomId,
      userId,
      mediaUrl,
      type,
      createdAt: new Date(),
    },
  });
};

export const getPostsByRoom = async (roomId) => {
  return prisma.post.findMany({
    where: { roomId },
    orderBy: { createdAt: "desc" },
    include: {
      user: true,
      comments: true,
      likes: true,
    },
  });
};

// ===== LIKES (THIS WAS MISSING) =====

export const likePost = async (postId, userId) => {
  try {
    await prisma.postLike.create({
      data: { postId, userId },
    });
  } catch (err) {
    // unique constraint violation
    throw new AppError("Post already liked", 409);
  }
};

export const unlikePost = async (postId, userId) => {
  await prisma.postLike.delete({
    where: {
      postId_userId: { postId, userId },
    },
  });
};
