import mongoose from "mongoose";
import ChatRoom from "../models/ChatRoom.js";
import Message from "../models/Message.js";
import User from "../models/User.model.js";
import { emitToRoom, emitToUser } from "../lib/socket.js";
import { uploadFile, deleteFile } from "../lib/s3.storage.js";

// Utilities
const toObjectId = (id, name = "ID") => {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new Error(`${name} is invalid`);
  }
  return new mongoose.Types.ObjectId(id);
};

// Extract S3 key from URL
const extractS3Key = (url) => {
  if (!url) return null;
  try {
    // Handle format: https://bucket-name.s3.region.amazonaws.com/key
    const urlObj = new URL(url);
    return urlObj.pathname.substring(1); // Remove leading '/'
  } catch (error) {
    console.error("Failed to extract S3 key from URL:", url, error);
    return null;
  }
};

const formatRoom = (room, { lastMessage = null, unreadCount = 0 } = {}) => {
  return {
    ...room.toJSON(),
    lastMessage,
    unreadCount,
  };
};

const POPULATE_MEMBERS = {
  path: "members",
  select: "username profile",
  populate: { path: "profile", select: "familyName givenName birthDate gender imageUrl" },
};

const POPULATE_SENDER = {
  path: "senderId",
  select: "username profile",
  populate: { path: "profile", select: "familyName givenName birthDate gender imageUrl" },
};

// Services
export async function isUserInRoom(userId, roomId) {
  const exists = await ChatRoom.exists({ 
    _id: toObjectId(roomId, "Room ID"), 
    members: toObjectId(userId, "User ID") 
  });
  return Boolean(exists);
}

export async function getChatRoomsForUser(userId) {
  const userObjId = toObjectId(userId, "User ID");
  const rooms = await ChatRoom.find({ members: userObjId })
    .sort({ updatedAt: -1 })
    .populate(POPULATE_MEMBERS);

  const enriched = await Promise.all(
    rooms.map(async (room) => {
      const deletion = room.deletedFor?.find(
        (entry) => entry?.userId?.toString() === userObjId.toString()
      );

      const msgQuery = { roomId: room._id };
      if (deletion?.deletedAt) {
        msgQuery.createdAt = { $gt: deletion.deletedAt };
      }

      const lastMessage = await Message.findOne(msgQuery)
        .sort({ createdAt: -1 })
        .populate(POPULATE_SENDER);

      // Hide room if deleted and no new messages
      if (deletion && !lastMessage) return null;

      const unreadQuery = {
        roomId: room._id,
        senderId: { $ne: userObjId },
        isRead: false,
      };
      if (deletion?.deletedAt) {
        unreadQuery.createdAt = { $gt: deletion.deletedAt };
      }

      const unreadCount = await Message.countDocuments(unreadQuery);

      return formatRoom(room, { lastMessage, unreadCount });
    })
  );

  return enriched.filter(Boolean);
}

export async function createOrGetChatRoom({ userId, memberIds = [], isGroup = false, roomName = "", avatarFile = null }) {
  const currentUserId = toObjectId(userId, "User ID");
  const uniqueIds = new Set([
    currentUserId.toString(),
    ...memberIds.map((id) => toObjectId(id, "Member ID").toString()),
  ]);
  const memberObjIds = Array.from(uniqueIds).map((id) => new mongoose.Types.ObjectId(id));

  if (!isGroup && memberObjIds.length !== 2) {
    throw new Error("Direct chat must have exactly two members");
  }

  // Check for existing direct chat
  if (!isGroup) {
    const existing = await ChatRoom.findOne({
      isGroup: false,
      members: { $all: memberObjIds, $size: memberObjIds.length },
    }).populate(POPULATE_MEMBERS);

    if (existing) {
      // Restore if deleted
      await ChatRoom.updateOne(
        { _id: existing._id },
        { $pull: { deletedFor: { userId: currentUserId } } }
      );

      const lastMessage = await Message.findOne({ roomId: existing._id })
        .sort({ createdAt: -1 })
        .populate(POPULATE_SENDER);

      const unreadCount = await Message.countDocuments({
        roomId: existing._id,
        senderId: { $ne: currentUserId },
        isRead: false,
      });

      return { room: formatRoom(existing, { lastMessage, unreadCount }), created: false };
    }
  }

  // Upload avatar if provided
  let groupAvatar = "";
  if (avatarFile && isGroup) {
    try {
      const uploadResult = await uploadFile(avatarFile, { folder: "group-avatars" });
      groupAvatar = uploadResult.url;
    } catch (error) {
      console.error("Avatar upload failed:", error);
      // Continue without avatar
    }
  }

  // Create new room
  const chatRoom = await ChatRoom.create({ roomName, isGroup, groupAvatar, members: memberObjIds });
  await User.updateMany(
    { _id: { $in: memberObjIds } },
    { $addToSet: { chatRooms: chatRoom._id } }
  );

  const hydrated = await ChatRoom.findById(chatRoom._id).populate(POPULATE_MEMBERS);
  const formatted = formatRoom(hydrated, { lastMessage: null, unreadCount: 0 });

  memberObjIds.forEach((id) => {
    emitToUser(id.toString(), "room:created", { room: formatted });
  });

  return { room: formatted, created: true };
}

export async function getMessagesForRoom(roomId, { limit = 50, before, viewerId } = {}) {
  const roomObjId = toObjectId(roomId, "Room ID");
  const query = { roomId: roomObjId };

  if (before) {
    query.createdAt = { $lt: new Date(before) };
  }

  // Filter messages based on viewer's deletion timestamp
  if (viewerId) {
    const viewerObjId = toObjectId(viewerId, "Viewer ID");
    const room = await ChatRoom.findById(roomObjId).select("deletedFor");
    const deletion = room?.deletedFor?.find(
      (entry) => entry?.userId?.toString() === viewerObjId.toString()
    );

    if (deletion?.deletedAt) {
      query.createdAt = { ...(query.createdAt || {}), $gt: deletion.deletedAt };
    }
  }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(Math.max(1, Math.min(Number(limit) || 50, 200)))
    .populate(POPULATE_SENDER);

  return messages.reverse();
}

export async function createMessageInRoom(roomId, senderId, content) {
  if (!content?.trim()) {
    throw new Error("Message content is required");
  }

  const roomObjId = toObjectId(roomId, "Room ID");
  const senderObjId = toObjectId(senderId, "Sender ID");

  const room = await ChatRoom.findById(roomObjId);
  if (!room) {
    throw new Error("Chat room not found");
  }

  if (!room.members.some((id) => id.toString() === senderObjId.toString())) {
    throw new Error("You are not a member of this chat room");
  }

  const message = await Message.create({
    roomId: roomObjId,
    senderId: senderObjId,
    content: content.trim(),
  });

  // Update room and restore if deleted
  await ChatRoom.updateOne(
    { _id: roomObjId },
    {
      $set: { updatedAt: new Date() },
      $pull: { deletedFor: { userId: senderObjId } },
    }
  );

  const populated = await message.populate(POPULATE_SENDER);

  console.log(`Emitting message to room ${roomObjId}:`, {
    messageId: populated._id,
    content: populated.content,
    senderId: populated.senderId?._id,
  });

  emitToRoom(roomObjId.toString(), "message:new", {
    roomId: roomObjId.toString(),
    message: populated,
  });

  return populated;
}

export async function markRoomMessagesAsRead(roomId, userId) {
  const roomObjId = toObjectId(roomId, "Room ID");
  const userObjId = toObjectId(userId, "User ID");

  const messages = await Message.find({
    roomId: roomObjId,
    senderId: { $ne: userObjId },
    isRead: false,
  }).select("_id");

  const ids = messages.map((m) => m._id);

  if (ids.length > 0) {
    await Message.updateMany(
      { _id: { $in: ids } },
      { $set: { isRead: true, updatedAt: new Date() } }
    );

    emitToRoom(roomObjId.toString(), "messages:read", {
      roomId: roomObjId.toString(),
      readerId: userObjId.toString(),
      messageIds: ids.map((id) => id.toString()),
    });
  }

  return {
    updatedCount: ids.length,
    messageIds: ids.map((id) => id.toString()),
  };
}

export async function searchUsersByUsername(currentUserId, query, { limit = 10 } = {}) {
  if (!query?.trim()) return [];

  const safeLimit = Math.max(1, Math.min(Number(limit) || 10, 25));
  const regex = new RegExp(query.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");

  const users = await User.find({
    _id: { $ne: toObjectId(currentUserId, "User ID") },
    username: regex,
  })
    .limit(safeLimit)
    .select("username profile")
    .populate({ path: "profile", select: "familyName givenName birthDate gender imageUrl" });

  return users;
}

export async function updateGroupAvatar(roomId, userId, avatarFile) {
  const roomObjId = toObjectId(roomId, "Room ID");
  const userObjId = toObjectId(userId, "User ID");

  const room = await ChatRoom.findById(roomObjId).select("members isGroup groupAvatar");
  if (!room) {
    const error = new Error("Chat room not found");
    error.status = 404;
    throw error;
  }

  if (!room.isGroup) {
    const error = new Error("Cannot update avatar for direct chats");
    error.status = 400;
    throw error;
  }

  if (!room.members?.some((id) => id.toString() === userObjId.toString())) {
    const error = new Error("You are not a member of this group");
    error.status = 403;
    throw error;
  }

  // Delete old avatar from S3 if it exists
  if (room.groupAvatar) {
    const oldKey = extractS3Key(room.groupAvatar);
    if (oldKey) {
      try {
        await deleteFile(oldKey);
        console.log(`Deleted old group avatar: ${oldKey}`);
      } catch (error) {
        console.error("Failed to delete old group avatar:", error);
        // Continue with upload even if delete fails
      }
    }
  }

  // Upload new avatar
  const uploadResult = await uploadFile(avatarFile, { folder: "group-avatars" });
  const groupAvatar = uploadResult.url;

  await ChatRoom.updateOne(
    { _id: roomObjId },
    { $set: { groupAvatar } }
  );

  const updated = await ChatRoom.findById(roomObjId).populate(POPULATE_MEMBERS);
  const formatted = formatRoom(updated);

  // Notify all members
  room.members.forEach((memberId) => {
    emitToUser(memberId.toString(), "room:updated", { room: formatted });
  });

  return formatted;
}

export async function deleteChatRoom(roomId, userId) {
  const roomObjId = toObjectId(roomId, "Room ID");
  const userObjId = toObjectId(userId, "User ID");

  const room = await ChatRoom.findById(roomObjId).select("members");
  if (!room) {
    const error = new Error("Chat room not found");
    error.status = 404;
    throw error;
  }

  if (!room.members?.some((id) => id.toString() === userObjId.toString())) {
    const error = new Error("You do not have permission to delete this room");
    error.status = 403;
    throw error;
  }

  const now = new Date();

  // Remove old deletion entry and add new one
  await ChatRoom.updateOne(
    { _id: roomObjId },
    { $pull: { deletedFor: { userId: userObjId } } }
  );

  await ChatRoom.updateOne(
    { _id: roomObjId },
    { $push: { deletedFor: { userId: userObjId, deletedAt: now } } }
  );

  // Check if all members have deleted the room
  const updatedRoom = await ChatRoom.findById(roomObjId).select("members deletedFor groupAvatar");
  const allMembersDeleted = updatedRoom.deletedFor.length === updatedRoom.members.length;

  if (allMembersDeleted) {
    console.log(` All members deleted room ${roomObjId} - performing hard delete`);
    
    // 1. Delete group avatar from S3 if exists
    if (updatedRoom.groupAvatar) {
      const key = extractS3Key(updatedRoom.groupAvatar);
      if (key) {
        try {
          await deleteFile(key);
          console.log(` Deleted S3 avatar: ${key}`);
        } catch (error) {
          console.error(` Failed to delete S3 avatar: ${error.message}`);
        }
      }
    }

    // 2. Delete all messages in the room
    const msgResult = await Message.deleteMany({ roomId: roomObjId });
    console.log(` Deleted ${msgResult.deletedCount} messages`);

    // 3. Delete the room permanently
    await ChatRoom.deleteOne({ _id: roomObjId });
    console.log(` Hard deleted room: ${roomObjId}`);

    return {
      roomId: roomObjId.toString(),
      deletedFor: userObjId.toString(),
      deletedAt: now,
      hardDeleted: true,
      messagesDeleted: msgResult.deletedCount
    };
  }

  // Soft delete only - not all members have deleted yet
  emitToUser(userObjId.toString(), "room:deleted", { roomId: roomObjId.toString() });

  return {
    roomId: roomObjId.toString(),
    deletedFor: userObjId.toString(),
    deletedAt: now,
    hardDeleted: false
  };
}
