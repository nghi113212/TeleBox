import { Server } from "socket.io";
import ChatRoom from "../models/ChatRoom.js";
import { verifyToken } from "./jwt.utils.js";

let ioInstance = null;

function parseCookies(cookieHeader = "") {
  return cookieHeader.split(";").reduce((acc, part) => {
    const [rawKey, ...rest] = part.trim().split("=");
    if (!rawKey) {
      return acc;
    }
    const key = decodeURIComponent(rawKey);
    const value = decodeURIComponent(rest.join("="));
    acc[key] = value;
    return acc;
  }, {});
}

export function initSocket(server, { corsOrigin } = {}) {
  if (ioInstance) {
    return ioInstance;
  }

  ioInstance = new Server(server, {
    cors: {
      origin: true,  // Allow all origins (same as HTTP CORS)
      credentials: true,
    },
  });

  ioInstance.use((socket, next) => {
    try {
      const cookies = parseCookies(socket.handshake.headers?.cookie || "");
      const token = cookies.authToken;
      if (!token) {
        return next(new Error("Unauthorized"));
      }
      const payload = verifyToken(token);
      socket.data = socket.data || {};
      socket.data.userId = payload.userId?.toString();
      return next();
    } catch (error) {
      return next(new Error("Unauthorized"));
    }
  });

  ioInstance.on("connection", async (socket) => {
    const userId = socket.data?.userId;
    if (!userId) {
      socket.disconnect(true);
      return;
    }

    try {
      const rooms = await ChatRoom.find({ members: userId }).select("_id");
      rooms.forEach((room) => {
        socket.join(room._id.toString());
      });
    } catch (error) {
      console.error("Socket join rooms error", error);
    }

    socket.join(userId);

    socket.on("joinRoom", async (roomId) => {
      if (!roomId) return;
      try {
        const roomExists = await ChatRoom.exists({ _id: roomId, members: userId });
        if (roomExists) {
          socket.join(roomId.toString());
        }
      } catch (error) {
        console.error("joinRoom error", error);
      }
    });

    socket.on("leaveRoom", (roomId) => {
      if (!roomId) return;
      socket.leave(roomId.toString());
    });
  });

  return ioInstance;
}

export function getIO() {
  if (!ioInstance) {
    throw new Error("Socket.io has not been initialized");
  }
  return ioInstance;
}

export function emitToRoom(roomId, event, payload) {
  if (!ioInstance || !roomId || !event) {
    return;
  }
  ioInstance.to(roomId.toString()).emit(event, payload);
}

export function emitToUser(userId, event, payload) {
  if (!ioInstance || !userId || !event) {
    return;
  }
  ioInstance.to(userId.toString()).emit(event, payload);
}
