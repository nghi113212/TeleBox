import express from "express";
import multer from "multer";
import { signUp, signIn, signOut, getMe, updateProfile } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/middleware.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

router.post("/signup", signUp);
router.post("/signin", signIn);
router.post("/signout", signOut);
router.get("/me", requireAuth, getMe);
router.patch("/profile", requireAuth, upload.single("avatar"), updateProfile);

export default router;