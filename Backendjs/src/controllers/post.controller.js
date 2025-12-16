import {
  createPost as createPostService,
  getPostsByRoom as getPostsByRoomService,
  likePost,
  unlikePost,
} from "../services/post.service.js";

export const createPost = async (req, res, next) => {
  try {
    const post = await createPostService({
      roomId: BigInt(req.params.roomId),
      userId: req.user.id,
      mediaUrl: req.body.mediaUrl,
      type: req.body.type,
    });

    res.status(201).json({ success: true, post });
  } catch (err) {
    next(err);
  }
};

export const getPostsByRoom = async (req, res, next) => {
  try {
    const posts = await getPostsByRoomService(
      BigInt(req.params.roomId)
    );

    res.json({ success: true, posts });
  } catch (err) {
    next(err);
  }
};

export const like = async (req, res, next) => {
  try {
    await likePost(BigInt(req.params.postId), req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const unlike = async (req, res, next) => {
  try {
    await unlikePost(BigInt(req.params.postId), req.user.id);
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
