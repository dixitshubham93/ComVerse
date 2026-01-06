import express from "express";
import { authenticate } from "../middlewares/jwt.middleware.js";

import {
  createPost,
  getPostsByRoom,
  deletePost,
  like,
  unlike,
} from "../controllers/post.controller.js";

import {
  createComment,
  getComments,
} from "../controllers/comment.controller.js";

const router = express.Router();

// POSTS
router.post("/:roomId", authenticate, createPost);
router.get("/:roomId", getPostsByRoom);
router.delete("/:postId", authenticate, deletePost);

// COMMENTS
router.post("/comment/:postId", authenticate, createComment);
router.get("/comment/:postId", getComments);

// LIKES
router.post("/like/:postId", authenticate, like);
router.delete("/like/:postId", authenticate, unlike);

export default router;
