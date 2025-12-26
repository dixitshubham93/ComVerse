import express from "express";
import { authenticate } from "../middlewares/jwt.middleware.js";
import { create, getByCommunity, deleteRoom, getVoiceMetadata, update } from "../controllers/room.controller.js";

const router = express.Router();

router.post("/:communityId", authenticate, create);
router.get("/community/:communityId", getByCommunity);
router.get("/:roomId/voice-metadata", getVoiceMetadata);
router.delete("/:id", authenticate, deleteRoom);
router.put("/:id", authenticate, update);

export default router;
