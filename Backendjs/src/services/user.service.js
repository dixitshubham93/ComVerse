import { prisma } from "../config/db.js";

export const getUserById = async (id) => {
  const user = await prisma.user.findUnique({
    where: { id },
  });

  if (!user) return null;

  return {
    id: Number(user.id),
    username: user.username,
    email: user.email,
    avatarUrl: user.avatarUrl,
    bannerUrl: user.bannerUrl,
    age: user.age,
  };
};

export const getCommunitiesForUser = async (userId) => {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: {
      community: true,
    },
  });

  return memberships.map(membership => ({
    id: Number(membership.community.id),
    name: membership.community.name,
    description: membership.community.description,
    bannerUrl: membership.community.bannerUrl,
    type: membership.community.type,
  }));
};

export const getCommunitiesForUserWithDetails = async (userId) => {
  const memberships = await prisma.membership.findMany({
    where: { userId },
    include: {
      community: {
        include: {
          memberships: true,
        },
      },
    },
  });

  return memberships.map(membership => ({
    id: Number(membership.community.id),
    name: membership.community.name,
    description: membership.community.description,
    bannerUrl: membership.community.bannerUrl,
    type: membership.community.type,
    memberCount: membership.community.memberships.length,
    userRole: membership.role,
  }));
};
