import { createRoom, getRoomsByCommunity } from "../services/room.service.js";

export const create = async (req, res, next) => {
  try {
    const room = await createRoom({
      communityId: BigInt(req.params.communityId),
      ...req.body,
    });

    res.status(201).json({ success: true, room });
  } catch (err) {
    next(err);
  }
};

export const getByCommunity = async (req, res, next) => {
  try {
    const rooms = await getRoomsByCommunity(
      BigInt(req.params.communityId)
    );
    res.json({ success: true, rooms });
  } catch (err) {
    next(err);
  }
};
