import {
  addComment,
  getCommentsByPost,
} from "../services/comment.service.js";

export const createComment = async (req, res, next) => {
  try {
    const comment = await addComment({
      postId: BigInt(req.params.postId),
      userId: req.user.id,
      content: req.body.content,
    });

    res.status(201).json({ success: true, comment });
  } catch (err) {
    next(err);
  }
};

export const getComments = async (req, res, next) => {
  try {
    const comments = await getCommentsByPost(
      BigInt(req.params.postId)
    );
    res.json({ success: true, comments });
  } catch (err) {
    next(err);
  }
};
