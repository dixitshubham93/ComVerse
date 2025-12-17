import {
  getDMHistory,
  markDMsAsRead,
  saveDM,
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

    // Convert BigInt to Number for JSON serialization
    const serializedMessages = messages.map(msg => ({
      id: Number(msg.id),
      senderId: Number(msg.senderId),
      receiverId: Number(msg.receiverId),
      content: msg.content,
      createdAt: msg.createdAt,
      read: msg.read,
    }));

    res.json({ success: true, messages: serializedMessages });
  } catch (err) {
    next(err);
  }
};

export const markRead = async (req, res, next) => {
  try {
    const userId = req.user.id; // Current user
    const otherUserId = BigInt(req.params.otherUserId); // Other user in the conversation

    // Mark all messages FROM other user TO current user as read
    await markDMsAsRead({ senderId: otherUserId, receiverId: userId });
    res.json({ success: true });
  } catch (err) {
    next(err);
  }
};

export const sendDM = async (req, res, next) => {
  try {
    const senderId = req.user.id;
    const { receiverId, content } = req.body;

    if (!receiverId || !content) {
      return res.status(400).json({ success: false, message: "receiverId and content are required" });
    }

    const message = await saveDM({
      senderId: BigInt(senderId),
      receiverId: BigInt(receiverId),
      content,
    });

    // Convert BigInt to Number for JSON serialization
    const serializedMessage = {
      ...message,
      id: Number(message.id),
      senderId: Number(message.senderId),
      receiverId: Number(message.receiverId),
    };

    res.status(201).json({ success: true, message: serializedMessage });
  } catch (err) {
    next(err);
  }
};