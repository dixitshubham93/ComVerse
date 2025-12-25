import jwt from "jsonwebtoken";
import dotenv from "dotenv";

dotenv.config();

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    console.error("JWT_SECRET is not defined in environment variables!");
    return res.status(500).json({ success: false, message: "Server configuration error" });
  }

  try {
    const decoded = jwt.verify(token, secret);
    
    if (!decoded || !decoded.id) {
      console.error("JWT Verification failed: Payload missing ID", decoded);
      return res.status(401).json({ success: false, message: "Invalid token structure" });
    }

    // Convert id to BigInt for Prisma
    req.user = {
      ...decoded,
      id: BigInt(decoded.id)
    };
    next();
  } catch (err) {
    console.error("JWT Verification Error:", err.message);
    return res.status(401).json({ 
      success: false, 
      message: `Invalid token: ${err.message}`,
      hint: "Try logging out and logging back in if the issue persists."
    });
  }
};
