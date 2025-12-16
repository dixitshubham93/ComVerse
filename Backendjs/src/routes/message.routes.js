import express from "express";
import { authenticate } from "../middlewares/jwt.middleware.js";
import { getByRoom } from "../controllers/message.controller.js";

const router = express.Router();

router.get("/:roomId", authenticate, getByRoom);

export default router;
