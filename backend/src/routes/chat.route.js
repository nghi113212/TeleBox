import express from "express";
import multer from "multer";
import {
  createChatRoom,
  deleteChatRoom,
  listChatRooms,
  listRoomMessages,
  markRoomRead,
  sendRoomMessage,
  searchUsers,
  updateGroupAvatar,
} from "../controllers/chat.controller.js";
import { requireAuth } from "../middleware/middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.use(requireAuth);

router.get("/rooms", listChatRooms);
router.post("/rooms", upload.single("groupAvatar"), createChatRoom);
router.put("/rooms/:roomId/avatar", upload.single("groupAvatar"), updateGroupAvatar);
router.delete("/rooms/:roomId", deleteChatRoom);
router.get("/rooms/:roomId/messages", listRoomMessages);
router.post("/rooms/:roomId/messages", sendRoomMessage);
router.post("/rooms/:roomId/read", markRoomRead);
router.get("/users", searchUsers);

export default router;

