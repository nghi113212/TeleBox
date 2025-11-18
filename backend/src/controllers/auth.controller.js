import * as authService from "../services/auth.service.js";
import { verifyToken } from "../lib/jwt.utils.js";
import User from "../models/User.model.js";

const COOKIE_OPTIONS = (isProduction) => ({
  httpOnly: true,
  secure: false,  // Tắt Secure vì chưa có HTTPS (dùng HTTP)
  sameSite: "lax",  // lax cho HTTP, none cho HTTPS + cross-site
  path: "/",
});

export const signUp = async (req, res) => {
  try {
    const { username, password, familyName, givenName, birthDate, gender } = req.body;
    await authService.signUpService(username, password, familyName, givenName, birthDate, gender);
    res.status(201).json({ message: "Sign up successfully" });
  } catch (error) {
    const status = error.message === "Username already taken" ? 400 : 500;
    res.status(status).json({ message: error.message });
  }
};

export const signIn = async (req, res) => {
  try {
    const { username, password } = req.body;
    const result = await authService.signInService(username, password);

    if (!result.success) {
      return res.status(401).json({ message: result.message });
    }

    const isProduction = process.env.NODE_ENV === "production";
    res.cookie("authToken", result.token, {
      ...COOKIE_OPTIONS(isProduction),
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({ message: "Sign in successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const signOut = async (req, res) => {
  try {
    const isProduction = process.env.NODE_ENV === "production";
    res.clearCookie("authToken", COOKIE_OPTIONS(isProduction));
    res.json({ message: "Sign out successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getMe = async (req, res) => {
  try {
    const token = req.cookies?.authToken;
    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const payload = verifyToken(token);
    const user = await User.findById(payload.userId).populate("profile");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      userId: user._id.toString(),
      username: user.username,
      profile: user.profile,
    });
  } catch (error) {
    res.status(401).json({ message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const result = await authService.updateProfileService(userId, {
      ...req.body,
      avatarFile: req.file,
    });

    res.json({
      message: "Profile updated successfully",
      ...result,
    });
  } catch (error) {
    const status = error.status || 500;
    res.status(status).json({ 
      message: status === 500 ? "Failed to update profile" : error.message 
    });
  }
};
