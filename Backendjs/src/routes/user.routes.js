import express from "express";
import { getUser, getUserCommunities, getUserCommunitiesWithDetails } from "../controllers/user.controller.js";

const router = express.Router();

router.get("/:id", getUser);
router.get("/:id/communities", getUserCommunities);
router.get("/:id/communities/details", getUserCommunitiesWithDetails);

export default router;
