import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const createPost = async ({
  roomId,
  userId,
  mediaUrl,
  caption,
  type,
}) => {
  return prisma.post.create({
    data: {
      roomId,
      userId,
      mediaUrl,
      caption,
      type,
      createdAt: new Date(),
    },
    include: {
      user: true,
      comments: true,
      likes: true,
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

export const getPostById = async (id) => {
  return prisma.post.findUnique({
    where: { id },
    include: {
      user: true,
      comments: true,
      likes: true,
    },
  });
};

export const deletePost = async (id) => {
  return prisma.post.delete({
    where: { id },
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

export const getPostsByUser = async (userId, limit = 50) => {
  return prisma.post.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: true,
      comments: true,
      likes: true,
    },
  });
};

export const getRecentPostsByUser = async (userId, limit = 10) => {
  return prisma.post.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      user: true,
      comments: true,
      likes: true,
    },
  });
};
