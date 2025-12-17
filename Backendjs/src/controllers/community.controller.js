import {
  createCommunity,
  getAllCommunities,
  getCommunityById,
  getCommunityStats,
  deleteCommunity,
} from "../services/community.service.js";

export const create = async (req, res, next) => {
  try {
    const community = await createCommunity({
      ...req.body,
      userId: req.user.id,
    });
    
    // Convert BigInt to Number for JSON serialization
    const serializedCommunity = {
      ...community,
      id: Number(community.id),
    };
    
    res.status(201).json({ success: true, data: serializedCommunity });
  } catch (err) {
    console.error('Error in create community controller:', err);
    next(err);
  }
};

export const getAll = async (_, res, next) => {
  try {
    const communities = await getAllCommunities();
    
    // Convert BigInt to Number for JSON serialization
    const serializedCommunities = communities.map(c => ({
      ...c,
      id: Number(c.id),
      memberships: c.memberships?.map(m => ({
        ...m,
        id: Number(m.id),
        userId: Number(m.userId),
        communityId: Number(m.communityId),
      })) || [],
    }));
    
    res.json({ success: true, data: serializedCommunities });
  } catch (err) {
    console.error('Error in getAll communities controller:', err);
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const community = await getCommunityById(BigInt(req.params.id));
    
    // Convert BigInt to Number for JSON serialization
    const serializedCommunity = {
      ...community,
      id: Number(community.id),
      rooms: community.rooms?.map(r => ({
        ...r,
        id: Number(r.id),
        communityId: Number(r.communityId),
      })) || [],
      memberships: community.memberships?.map(m => ({
        ...m,
        id: Number(m.id),
        userId: Number(m.userId),
        communityId: Number(m.communityId),
        user: m.user ? {
          ...m.user,
          id: Number(m.user.id),
        } : null,
      })) || [],
    };
    
    res.json({ success: true, data: serializedCommunity });
  } catch (err) {
    console.error('Error in getById community controller:', err);
    next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await getCommunityStats(BigInt(req.params.id));
    res.json({ success: true, data: stats });
  } catch (err) {
    console.error('Error in getStats community controller:', err);
    next(err);
  }
};

export const deleteComm = async (req, res, next) => {
  try {
    const result = await deleteCommunity(BigInt(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) {
    console.error('Error in deleteComm community controller:', err);
    next(err);
  }
};
