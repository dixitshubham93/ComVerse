import { createRoom, getRoomsByCommunity, deleteRoom as deleteRoomService } from "../services/room.service.js";
import { voicePresence } from "../sockets/voice.presence.js";

export const getVoiceMetadata = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const users = voicePresence.getUsers(roomId);
    
    // Ensure all user IDs are numbers or strings as expected by frontend
    const formattedUsers = users.map(user => ({
      ...user,
      id: user.id.toString()
    }));
    
    res.json({
      success: true,
      data: {
        roomId,
        activeUsers: formattedUsers.length,
        users: formattedUsers
      }
    });
  } catch (err) {
    next(err);
  }
};

export const create = async (req, res, next) => {
  try {
    const room = await createRoom({
      communityId: BigInt(req.params.communityId),
      ...req.body,
    });

    // Convert BigInt to Number for JSON serialization
    const serializedRoom = {
      ...room,
      id: Number(room.id),
      communityId: Number(room.communityId),
    };

    res.status(201).json({ success: true, data: serializedRoom });
  } catch (err) {
    next(err);
  }
};

export const getByCommunity = async (req, res, next) => {
  try {
    const rooms = await getRoomsByCommunity(
      BigInt(req.params.communityId)
    );
    
    // Convert BigInt to Number for JSON serialization
    const serializedRooms = rooms.map(r => ({
      ...r,
      id: Number(r.id),
      communityId: Number(r.communityId),
    }));
    
    res.json({ success: true, data: serializedRooms });
  } catch (err) {
    next(err);
  }
};

export const deleteRoom = async (req, res, next) => {
  try {
    const result = await deleteRoomService(BigInt(req.params.id));
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};
