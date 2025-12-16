import { getMessagesByRoom } from "../services/message.service.js";

export const getByRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await getMessagesByRoom(
      BigInt(roomId),
      Number(limit),
      Number(offset)
    );

    res.json({ success: true, messages });
  } catch (err) {
    next(err);
  }
};
