import express from "express";
import { authenticate } from "../middlewares/jwt.middleware.js";
import { getByRoom, createMessage } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/:roomId", authenticate, getByRoom);
router.post("/:roomId", authenticate, createMessage);

export default router;
