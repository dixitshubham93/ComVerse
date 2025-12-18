import {
  createPost as createPostService,
  getPostsByRoom as getPostsByRoomService,
  likePost,
  unlikePost,
} from "../services/post.service.js";

const serializePost = (post) => ({
  id: Number(post.id),
  mediaUrl: post.mediaUrl,
  caption: post.caption || null,
  type: post.type,
  createdAt: post.createdAt,
  roomId: Number(post.roomId),
  userId: Number(post.userId),
  user: post.user ? {
    id: Number(post.user.id),
    username: post.user.username,
    email: post.user.email,
    avatarUrl: post.user.avatarUrl,
  } : null,
  comments: post.comments ? post.comments.map(c => ({
    id: Number(c.id),
    content: c.content,
    createdAt: c.createdAt,
    userId: Number(c.userId),
    postId: Number(c.postId),
  })) : [],
  likes: post.likes ? post.likes.map(l => ({
    id: Number(l.id),
    postId: Number(l.postId),
    userId: Number(l.userId),
  })) : [],
  likeCount: post.likes ? post.likes.length : 0,
  commentCount: post.comments ? post.comments.length : 0,
});

export const createPost = async (req, res, next) => {
  try {
    const post = await createPostService({
      roomId: BigInt(req.params.roomId),
      userId: req.user.id,
      mediaUrl: req.body.mediaUrl,
      caption: req.body.caption || null,
      type: req.body.type || 'IMAGE',
    });

    res.status(201).json({ success: true, post: serializePost(post) });
  } catch (err) {
    next(err);
  }
};

export const getPostsByRoom = async (req, res, next) => {
  try {
    const posts = await getPostsByRoomService(
      BigInt(req.params.roomId)
    );

    const serializedPosts = posts.map(serializePost);
    res.json({ success: true, posts: serializedPosts });
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
