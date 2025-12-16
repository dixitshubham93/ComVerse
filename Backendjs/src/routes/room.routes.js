import express from "express";
import { authenticate } from "../middlewares/jwt.middleware.js";
import { create, getByCommunity } from "../controllers/room.controller.js";

const router = express.Router();

router.post("/:communityId", authenticate, create);
router.get("/:communityId", getByCommunity);

export default router;
