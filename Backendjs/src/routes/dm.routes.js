import express from "express";
import { authenticate } from "../middlewares/jwt.middleware.js";
import { getHistory, markRead } from "../controllers/dm.controller.js";

const router = express.Router();

router.get("/:otherUserId", authenticate, getHistory);
router.post("/:otherUserId/read", authenticate, markRead);

export default router;
