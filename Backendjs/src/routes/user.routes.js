import express from "express";
import { getUser, getUserCommunities, getUserCommunitiesWithDetails, getUserPosts, getUserRecentPosts } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/:id", getUser);
router.get("/:id/communities", getUserCommunities);
router.get("/:id/communities/details", getUserCommunitiesWithDetails);
router.get("/:id/posts", getUserPosts);
router.get("/:id/recent-posts", getUserRecentPosts);

export default router;
