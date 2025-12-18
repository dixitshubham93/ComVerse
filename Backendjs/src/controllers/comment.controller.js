import {
  addComment,
  getCommentsByPost,
} from "../services/comment.service.js";

const serializeComment = (comment) => ({
  id: Number(comment.id),
  content: comment.content,
  createdAt: comment.createdAt,
  postId: Number(comment.postId),
  userId: Number(comment.userId),
  user: comment.user ? {
    id: Number(comment.user.id),
    username: comment.user.username,
    email: comment.user.email,
    avatarUrl: comment.user.avatarUrl,
  } : null,
});

export const createComment = async (req, res, next) => {
  try {
    console.log("Creating comment for postId:", req.params.postId, "userId:", req.user.id);
    const comment = await addComment({
      postId: BigInt(req.params.postId),
      userId: req.user.id,
      content: req.body.content,
    });
    console.log("Comment created successfully:", comment.id);
    res.status(201).json({ success: true, comment: serializeComment(comment) });
  } catch (err) {
    console.error("Error in createComment controller:", err);
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const comments = await getCommentsByPost(
      BigInt(req.params.postId)
    );
    const serializedComments = comments.map(serializeComment);
    res.json({ success: true, comments: serializedComments });
  } catch (err) {
    next(err);
  }
};
