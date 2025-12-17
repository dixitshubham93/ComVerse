import express from "express";
import { authenticate } from "../middlewares/jwt.middleware.js";
import { getHistory, markRead, sendDM } from "../controllers/dm.controller.js";

const router = express.Router();

router.get("/:otherUserId", authenticate, getHistory);
router.post("/:otherUserId/read", authenticate, markRead);
router.post("/send", authenticate, sendDM);

export default router;
