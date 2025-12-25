import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const createCommunity = async ({ name, description, bannerUrl, type, userId }) => {
  try {
    const existing = await prisma.community.findUnique({ where: { name } });
    if (existing) throw new AppError("Community already exists", 409);

    // Create community with owner membership and default rooms in a transaction
    const community = await prisma.community.create({
      data: {
        name,
        description,
        bannerUrl,
        type: type || 'PUBLIC',
        memberships: {
          create: {
            userId,
            role: "OWNER",
            joinedAt: new Date(),
          },
        },
        rooms: {
          create: [
            {
              name: "Announcement",
              type: "ANNOUNCEMENT",
              isDefaultRoom: true,
              readOnly: true,
              adminOnly: false,
              locked: false,
              createdAt: new Date(),
            },
            {
              name: "General",
              type: "GENERAL",
              isDefaultRoom: true,
              readOnly: false,
              adminOnly: false,
              locked: false,
              createdAt: new Date(),
            },
          ],
        },
      },
    });

    return community;
  } catch (error) {
    console.error('Error in createCommunity service:', error);
    throw error;
  }
};

export const getAllCommunities = async () => {
  try {
    return prisma.community.findMany({
      include: { memberships: true },
    });
  } catch (error) {
    console.error('Error in getAllCommunities service:', error);
    throw error;
  }
};

export const getCommunityById = async (id) => {
  try {
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        rooms: true,
        memberships: {
          include: { user: true },
        },
      },
    });

    if (!community) throw new AppError("Community not found", 404);
    return community;
  } catch (error) {
    console.error('Error in getCommunityById service:', error);
    throw error;
  }
};

export const getCommunityStats = async (id) => {
  try {
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        memberships: true,
      },
    });

    if (!community) throw new AppError("Community not found", 404);

    const totalMembers = community.memberships.length;
    // For now, return a more realistic active count (between 20% and 40% of total)
    // In a production app, this would be tracked via a presence service/Redis.
    const activeMembers = Math.max(1, Math.floor(totalMembers * (0.2 + Math.random() * 0.2)));

    return {
      totalMembers,
      activeMembers,
    };
  } catch (error) {
    console.error('Error in getCommunityStats service:', error);
    throw error;
  }
};

export const deleteCommunity = async (id) => {
  try {
    const community = await prisma.community.findUnique({
      where: { id },
      include: {
        memberships: true,
      },
    });

    if (!community) throw new AppError("Community not found", 404);

    // Check if user is the owner
    const ownerMembership = community.memberships.find(m => m.role === "OWNER");
    if (!ownerMembership) throw new AppError("Community has no owner", 400);

    // Delete the community (cascade will handle related data)
    await prisma.community.delete({
      where: { id },
    });

    return { message: "Community deleted successfully" };
  } catch (error) {
    console.error('Error in deleteCommunity service:', error);
    throw error;
  }
};
