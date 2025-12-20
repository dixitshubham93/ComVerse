import express from "express";
import { authenticate } from "../middlewares/jwt.middleware.js";
import { createBattle, getBattlesByRoom, voteInBattle } from "../controllers/battle.controller.js";

const router = express.Router();

router.post("/", authenticate, createBattle);
router.get("/room/:roomId", getBattlesByRoom);
router.post("/vote", authenticate, voteInBattle);

export default router;
