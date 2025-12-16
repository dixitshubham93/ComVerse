import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const joinCommunity = async (req, res, next) => {
  try {
    const { communityId } = req.params;

    const exists = await prisma.membership.findUnique({
      where: {
        userId_communityId: {
          userId: req.user.id,
          communityId: BigInt(communityId),
        },
      },
    });

    if (exists) throw new AppError("Already a member", 409);

    await prisma.membership.create({
      data: {
        userId: req.user.id,
        communityId: BigInt(communityId),
        role: "MEMBER",
        joinedAt: new Date(),
      },
    });

    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
