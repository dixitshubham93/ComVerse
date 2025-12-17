import express from "express";
import { authenticate } from "../middlewares/jwt.middleware.js";
import { 
  checkMembership,
  getUserRole, 
  joinCommunity, 
  getCommunityMembers 
} from "../controllers/membership.controller.js";

const router = express.Router();

router.get("/check/:userId/:communityId", checkMembership);
router.get("/role/:userId/:communityId", getUserRole);
router.get("/community/:communityId", getCommunityMembers);
router.post("/join/:communityId", authenticate, joinCommunity);

export default router;
