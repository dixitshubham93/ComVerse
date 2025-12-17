import express from "express";
import { authenticate } from "../middlewares/jwt.middleware.js";
import { create, getAll, getById, getStats, deleteComm } from "../controllers/community.controller.js";

const router = express.Router();

router.post("/", authenticate, create);
router.get("/", getAll);
router.get("/:id/stats", getStats); // More specific route must come first
router.get("/:id", getById);
router.delete("/:id", authenticate, deleteComm);

export default router;
