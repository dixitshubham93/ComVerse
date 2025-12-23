import { verifyToken } from "../utils/jwt.js";
import { prisma } from "../config/db.js";

export const socketAuth = async (socket, next) => {
  try {
    // token can come from auth or headers
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Unauthorized: No token"));
    }

    const decoded = verifyToken(token);
    const userId = BigInt(decoded.id);

    // Fetch full user info for presence
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        email: true,
      }
    });

    if (!user) {
      return next(new Error("User not found"));
    }

    // attach authenticated user to socket
    socket.user = {
      ...user,
      id: Number(user.id) // Convert to Number for JSON serialization and consistency
    };

    next();
  } catch (err) {
    next(new Error("Unauthorized: Invalid token"));
  }
};
