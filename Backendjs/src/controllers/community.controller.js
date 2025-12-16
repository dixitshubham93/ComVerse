import {
  createCommunity,
  getAllCommunities,
  getCommunityById,
  getCommunityStats,
} from "../services/community.service.js";

export const create = async (req, res, next) => {
  try {
    const community = await createCommunity({
      ...req.body,
      userId: req.user.id,
    });
    res.status(201).json({ success: true, data: community });
  } catch (err) {
    console.error('Error in create community controller:', err);
    next(err);
  }
};

export const getAll = async (_, res, next) => {
  try {
    const communities = await getAllCommunities();
    res.json({ success: true, data: communities });
  } catch (err) {
    console.error('Error in getAll communities controller:', err);
    next(err);
  }
};

export const getById = async (req, res, next) => {
  try {
    const community = await getCommunityById(BigInt(req.params.id));
    res.json(community);
  } catch (err) {
    console.error('Error in getById community controller:', err);
    next(err);
  }
};

export const getStats = async (req, res, next) => {
  try {
    const stats = await getCommunityStats(BigInt(req.params.id));
    res.json(stats);
  } catch (err) {
    console.error('Error in getStats community controller:', err);
    next(err);
  }
};

export const deleteComm = async (req, res, next) => {
  try {
    const result = await deleteCommunity(BigInt(req.params.id));
    res.json(result);
  } catch (err) {
    console.error('Error in deleteComm community controller:', err);
    next(err);
  }
};
