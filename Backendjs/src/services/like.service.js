import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const likePost = async (postId, userId) => {
  try {
    return await prisma.postLike.create({
      data: { postId, userId },
    });
  } catch {
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
