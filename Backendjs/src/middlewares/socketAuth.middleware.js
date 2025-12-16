import { verifyToken } from "../utils/jwt.js";

export const socketAuth = (socket, next) => {
  try {
    // token can come from auth or headers
    const token =
      socket.handshake.auth?.token ||
      socket.handshake.headers?.authorization?.split(" ")[1];

    if (!token) {
      return next(new Error("Unauthorized: No token"));
    }

    const decoded = verifyToken(token);

    // attach authenticated user to socket
    socket.user = {
      id: BigInt(decoded.id),
      email: decoded.email,
    };

    next();
  } catch (err) {
    next(new Error("Unauthorized: Invalid token"));
  }
};
