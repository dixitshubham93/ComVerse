import express from "express";
import { authenticate } from "../middlewares/jwt.middleware.js";
import { create, getByCommunity, deleteRoom } from "../controllers/room.controller.js";

const router = express.Router();

router.post("/:communityId", authenticate, create);
router.get("/community/:communityId", getByCommunity);
router.delete("/:id", authenticate, deleteRoom);

export default router;
