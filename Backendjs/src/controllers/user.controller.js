import { getUserById, getCommunitiesForUser, getCommunitiesForUserWithDetails } from "../services/user.service.js";
import { getPostsByUser, getRecentPostsByUser } from "../services/post.service.js";
import { AppError } from "../utils/AppError.js";

export const getUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      console.error('Invalid user ID provided:', id);
      return next(new AppError("Invalid user ID", 400));
    }

    console.log('Fetching user with ID:', userId);
    const user = await getUserById(userId);

    if (!user) {
      console.error('User not found for ID:', userId);
      return next(new AppError("User not found", 404));
    }

    console.log('User retrieved successfully:', user.username);
    // Return user directly in data field (not nested)
    res.status(200).json({
      success: true,
      message: "User retrieved successfully",
      data: user,
    });
  } catch (err) {
    console.error('Error in getUser controller:', err);
    next(err);
  }
};

export const getUserCommunities = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return next(new AppError("Invalid user ID", 400));
    }

    const communities = await getCommunitiesForUser(userId);

    res.status(200).json({
      success: true,
      message: "User communities retrieved successfully",
      data: communities,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserCommunitiesWithDetails = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return next(new AppError("Invalid user ID", 400));
    }

    const communities = await getCommunitiesForUserWithDetails(userId);

    res.status(200).json({
      success: true,
      message: "User communities with details retrieved successfully",
      data: communities,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return next(new AppError("Invalid user ID", 400));
    }

    const posts = await getPostsByUser(BigInt(userId));

    // Convert BigInt to Number for JSON serialization
    const serializedPosts = posts.map(post => ({
      ...post,
      id: Number(post.id),
      roomId: Number(post.roomId),
      userId: Number(post.userId),
      user: post.user ? {
        ...post.user,
        id: Number(post.user.id),
      } : null,
      comments: post.comments.map(c => ({
        ...c,
        id: Number(c.id),
        postId: Number(c.postId),
        userId: Number(c.userId),
      })),
      likes: post.likes.map(l => ({
        ...l,
        id: Number(l.id),
        postId: Number(l.postId),
        userId: Number(l.userId),
      })),
      likeCount: post.likes.length,
      commentCount: post.comments.length,
    }));

    res.status(200).json({
      success: true,
      message: "User posts retrieved successfully",
      data: serializedPosts,
    });
  } catch (err) {
    next(err);
  }
};

export const getUserRecentPosts = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    if (isNaN(userId)) {
      return next(new AppError("Invalid user ID", 400));
    }

    const posts = await getRecentPostsByUser(BigInt(userId));

    // Convert BigInt to Number for JSON serialization
    const serializedPosts = posts.map(post => ({
      ...post,
      id: Number(post.id),
      roomId: Number(post.roomId),
      userId: Number(post.userId),
      user: post.user ? {
        ...post.user,
        id: Number(post.user.id),
      } : null,
      comments: post.comments.map(c => ({
        ...c,
        id: Number(c.id),
        postId: Number(c.postId),
        userId: Number(c.userId),
      })),
      likes: post.likes.map(l => ({
        ...l,
        id: Number(l.id),
        postId: Number(l.postId),
        userId: Number(l.userId),
      })),
      likeCount: post.likes.length,
      commentCount: post.comments.length,
    }));

    res.status(200).json({
      success: true,
      message: "User recent posts retrieved successfully",
      data: serializedPosts,
    });
  } catch (err) {
    next(err);
  }
};
