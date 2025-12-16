import { prisma } from "../config/db.js";

export const addComment = async ({
  postId,
  userId,
  content,
}) => {
  return prisma.comment.create({
    data: {
      postId,
      userId,
      content,
      createdAt: new Date(),
    },
  });
};

export const getCommentsByPost = async (postId) => {
  return prisma.comment.findMany({
    where: { postId },
    include: { user: true },
    orderBy: { createdAt: "asc" },
  });
};
