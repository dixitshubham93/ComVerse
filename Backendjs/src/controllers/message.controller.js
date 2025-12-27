import { getMessagesByRoom, createNewMessage } from "../services/message.service.js";
import { prisma } from "../config/db.js";
import { AppError } from "../utils/AppError.js";

export const getByRoom = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const messages = await getMessagesByRoom(
      BigInt(roomId),
      Number(limit),
      Number(offset)
    );

    // Convert BigInt to Number for JSON serialization
    const serializedMessages = messages.map(m => {
      const membership = m.user?.memberships?.[0];
      const role = membership ? membership.role : "MEMBER";
      
      return {
        ...m,
        id: Number(m.id),
        roomId: Number(m.roomId),
        userId: Number(m.userId),
        role: role, // Include the role at the message level for easy access
        user: m.user ? {
          ...m.user,
          id: Number(m.user.id),
          memberships: undefined, // Remove memberships from response to keep it clean
        } : null,
      };
    });

    res.json({ success: true, data: serializedMessages });
  } catch (err) {
    next(err);
  }
};

export const createMessage = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { content, imageUrl } = req.body;
    const userId = req.user.id;

    // Get room details
    const room = await prisma.room.findUnique({
      where: { id: BigInt(roomId) },
      include: { community: { include: { memberships: true } } },
    });

    if (!room) {
      throw new AppError("Room not found", 404);
    }

    // Check if user is a member
    const membership = room.community.memberships.find(
      (m) => m.userId === userId
    );

    if (!membership) {
      throw new AppError("You must be a member to post messages", 403);
    }

    // For ANNOUNCEMENT rooms, only OWNER/ADMIN can post
    if (room.type === "ANNOUNCEMENT") {
      if (membership.role !== "OWNER" && membership.role !== "ADMIN") {
        throw new AppError(
          "Only owners and admins can post in announcement rooms",
          403
        );
      }
    }

    // Determine content type and format content
    const contentType = imageUrl ? "IMAGE" : "TEXT";
    const messageContent = imageUrl ? `${content}\n[IMAGE:${imageUrl}]` : content;

    // Create message
    const message = await createNewMessage({
      roomId: BigInt(roomId),
      userId,
      content: messageContent,
      contentType,
    });

    // Serialize BigInt
    const membershipForRole = message.user?.memberships?.[0];
    const role = membershipForRole ? membershipForRole.role : "MEMBER";

    const serializedMessage = {
      ...message,
      id: Number(message.id),
      roomId: Number(message.roomId),
      userId: Number(message.userId),
      role: role,
      user: message.user
        ? {
            ...message.user,
            id: Number(message.user.id),
            memberships: undefined,
          }
        : null,
    };

    res.status(201).json({ success: true, data: serializedMessage });
  } catch (err) {
    next(err);
  }
};
