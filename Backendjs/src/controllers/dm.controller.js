import {
  getDMHistory,
  markDMsAsRead,
} from "../services/dm.service.js";

export const getHistory = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const otherUserId = BigInt(req.params.otherUserId);
    const { limit = 50, offset = 0 } = req.query;

    const messages = await getDMHistory({
      userId,
      otherUserId,
      limit: Number(limit),
      offset: Number(offset),
    });

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const receiverId = req.user.id;
    const senderId = BigInt(req.params.otherUserId);

    await markDMsAsRead({ senderId, receiverId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};
