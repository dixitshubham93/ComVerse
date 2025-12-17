import express from "express";
import cors from "cors";

import { errorHandler } from "./middlewares/error.middleware.js";

import authRoutes from "./Auth/auth.route.js";
import communityRoutes from "./routes/community.routes.js";
import roomRoutes from "./routes/room.routes.js";
import postRoutes from "./routes/post.routes.js";
import messageRoutes from "./routes/message.routes.js";
import dmRoutes from "./routes/dm.routes.js";
import userRoutes from "./routes/user.routes.js";
import membershipRoutes from "./routes/membership.routes.js";

const app = express();

// CORS configuration for both HTTP and WebSocket
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:3001'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ===== ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dm", dmRoutes);
app.use("/api/users", userRoutes);
app.use("/api/memberships", membershipRoutes);

// ===== ERROR HANDLER (MUST BE LAST) =====
app.use(errorHandler);

export default app;
