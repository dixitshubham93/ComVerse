// src/controllers/room.controller.js
import { 
  createRoom, 
  getRoomsByCommunity, 
  deleteRoom as deleteRoomService,
  updateRoom as updateRoomService
} from "../services/room.service.js";
import { getUsersInRoom } from "../services/presence.service.js";

export const update = async (req, res, next) => {
  try {
    const room = await updateRoomService(BigInt(req.params.id), req.body);

    const serializedRoom = {
      ...room,
      id: Number(room.id),
      communityId: Number(room.communityId),
    };

    res.json({ success: true, data: serializedRoom });
  } catch (err) {
    next(err);
  }
};

export const getVoiceMetadata = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const users = getUsersInRoom(roomId);
    
    // Format users for frontend
    const formattedUsers = users.map(user => ({
      id: Number(user.id),
      username: user.username,
      avatarUrl: user.avatarUrl,
      inCall: user.inCall || false
    }));
    
    res.json({
      success: true,
      data: {
        roomId: Number(roomId),
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