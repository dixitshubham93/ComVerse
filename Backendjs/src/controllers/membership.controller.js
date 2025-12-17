import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const checkMembership = async (req, res, next) => {
  try {
    const { userId, communityId } = req.params;

    const membership = await prisma.membership.findUnique({
      where: {
        userId_communityId: {
          userId: BigInt(userId),
          communityId: BigInt(communityId),
        },
      },
    });

    res.json({ success: true, data: !!membership });
  } catch (err) {
    next(err);
  }
};

export const getUserRole = async (req, res, next) => {
  try {
    const { userId, communityId } = req.params;

    const membership = await prisma.membership.findUnique({
      where: {
        userId_communityId: {
          userId: BigInt(userId),
          communityId: BigInt(communityId),
        },
      },
    });

    if (!membership) {
      return res.json({ success: true, data: null });
    }

    res.json({ success: true, data: membership.role });
  } catch (err) {
    next(err);
  }
};

export const getCommunityMembers = async (req, res, next) => {
  try {
    const { communityId } = req.params;

    const memberships = await prisma.membership.findMany({
      where: { communityId: BigInt(communityId) },
      include: { user: true },
    });

    // Convert BigInt to Number for JSON serialization
    const serializedMemberships = memberships.map(m => ({
      id: Number(m.id),
      userId: Number(m.userId),
      communityId: Number(m.communityId),
      role: m.role,
      joinedAt: m.joinedAt,
      user: m.user ? {
        id: Number(m.user.id),
        username: m.user.username,
        email: m.user.email,
        avatarUrl: m.user.avatarUrl,
      } : null,
    }));

    res.json({ success: true, data: serializedMemberships });
  } catch (err) {
    next(err);
  }
};

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

    const membership = await prisma.membership.create({
      data: {
        userId: req.user.id,
        communityId: BigInt(communityId),
        role: "MEMBER",
        joinedAt: new Date(),
      },
    });

    // Convert BigInt to Number for JSON serialization
    const serializedMembership = {
      id: Number(membership.id),
      userId: Number(membership.userId),
      communityId: Number(membership.communityId),
      role: membership.role,
      joinedAt: membership.joinedAt,
    };

    res.json({ success: true, data: serializedMembership });
  } catch (err) {
    next(err);
  }
};
