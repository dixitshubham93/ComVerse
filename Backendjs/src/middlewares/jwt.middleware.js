import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  const token = authHeader.split(" ")[1];

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
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
      return res.status(401).json({ success: false, message: "Invalid token" });
    }

};
