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

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.json({ limit: "200kb" }));
app.use(express.urlencoded({ extended: true, limit: "200kb" }));

// ===== ROUTES =====
app.use("/api/auth", authRoutes);
app.use("/api/communities", communityRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/dm", dmRoutes);
app.use("/api/users", userRoutes);

// ===== ERROR HANDLER (MUST BE LAST) =====
app.use(errorHandler);

export default app;
