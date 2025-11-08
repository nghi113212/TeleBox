import * as chatService from "../services/chat.service.js";

// Helper to handle errors consistently
const handleError = (res, error, defaultMessage) => {
  const status = error.status || 500;
  const message = status === 500 ? defaultMessage : error.message;
  return res.status(status).json({ message });
};

export async function listChatRooms(req, res) {
  try {
    const rooms = await chatService.getChatRoomsForUser(req.user.userId);
    res.json({ rooms });
  } catch (error) {
    handleError(res, error, "Failed to fetch chat rooms");
  }
}

export async function createChatRoom(req, res) {
  try {
    let { memberIds, isGroup, roomName } = req.body;
    
    // Parse memberIds if it's a string (from FormData)
    if (typeof memberIds === 'string') {
      memberIds = [memberIds];
    } else if (!Array.isArray(memberIds)) {
      memberIds = [];
    }

    // Parse isGroup boolean
    isGroup = isGroup === 'true' || isGroup === true;

    if (memberIds.length === 0) {
      return res.status(400).json({ message: "memberIds array is required" });
    }

    const { room, created } = await chatService.createOrGetChatRoom({
      userId: req.user.userId,
      memberIds,
      isGroup,
      roomName: roomName || "",
      avatarFile: req.file || null,
    });

    res.status(created ? 201 : 200).json({ room });
  } catch (error) {
    handleError(res, error, "Failed to create chat room");
  }
}

export async function listRoomMessages(req, res) {
  try {
    const { roomId } = req.params;
    const { limit, before } = req.query;
    const userId = req.user.userId;

    if (!(await chatService.isUserInRoom(userId, roomId))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const messages = await chatService.getMessagesForRoom(roomId, { 
      limit, 
      before, 
      viewerId: userId 
    });

    res.json({ 
      messages, 
      hasMore: limit && messages.length === Number(limit) 
    });
  } catch (error) {
    handleError(res, error, "Failed to fetch messages");
  }
}

export async function sendRoomMessage(req, res) {
  try {
    const { roomId } = req.params;
    const { content } = req.body;
    const userId = req.user.userId;

    if (!(await chatService.isUserInRoom(userId, roomId))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const message = await chatService.createMessageInRoom(roomId, userId, content);
    res.status(201).json({ message });
  } catch (error) {
    handleError(res, error, "Failed to send message");
  }
}

export async function markRoomRead(req, res) {
  try {
    const { roomId } = req.params;
    const userId = req.user.userId;

    if (!(await chatService.isUserInRoom(userId, roomId))) {
      return res.status(403).json({ message: "Access denied" });
    }

    const result = await chatService.markRoomMessagesAsRead(roomId, userId);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to mark messages as read");
  }
}

export async function searchUsers(req, res) {
  try {
    const { q, limit } = req.query;
    const users = await chatService.searchUsersByUsername(req.user.userId, q, { limit });
    res.json({ users });
  } catch (error) {
    handleError(res, error, "Failed to search users");
  }
}

export async function updateGroupAvatar(req, res) {
  try {
    const { roomId } = req.params;
    const avatarFile = req.file;

    if (!avatarFile) {
      return res.status(400).json({ message: "Avatar file is required" });
    }

    const room = await chatService.updateGroupAvatar(roomId, req.user.userId, avatarFile);
    res.json({ room });
  } catch (error) {
    handleError(res, error, "Failed to update group avatar");
  }
}

export async function deleteChatRoom(req, res) {
  try {
    const result = await chatService.deleteChatRoom(req.params.roomId, req.user.userId);
    res.json(result);
  } catch (error) {
    handleError(res, error, "Failed to delete chat room");
  }
}
