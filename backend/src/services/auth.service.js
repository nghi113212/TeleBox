import User from "../models/User.model.js";
import Profile from "../models/Profile.model.js";
import bcrypt from "bcrypt";
import { generateToken } from "../lib/jwt.utils.js";
import { uploadFile, deleteFile } from "../lib/s3.storage.js";

export async function signUpService(username, password, familyName, givenName, birthDate, gender) {
  if (await User.findOne({ username })) {
    throw new Error("Username already taken");
  }

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await User.create({ username, password: hashedPassword });

  const profile = await Profile.create({ 
    familyName, 
    givenName, 
    birthDate, 
    gender
  });
  
  user.profile = profile._id;
  await user.save();
}

export async function signInService(username, password) {
  try {
    const user = await User.findOne({ username });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      throw new Error("Invalid username or password");
    }

    const token = generateToken({ userId: user._id });
    return { success: true, token };
  } catch (error) {
    return { success: false, message: error.message };
  }
}

export async function updateProfileService(userId, payload = {}) {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error("User not found");
    error.status = 404;
    throw error;
  }

  let profile = user.profile ? await Profile.findById(user.profile) : null;
  
  if (!profile) {
    profile = await Profile.create({});
    user.profile = profile._id;
    await user.save();
  }

  // Update text fields
  if (payload.name) {
    profile.givenName = payload.name.trim();
    profile.familyName = "";
  }
  if (payload.familyName) profile.familyName = payload.familyName.trim();
  if (payload.givenName) profile.givenName = payload.givenName.trim();
  if (payload.about !== undefined) {
    profile.about = payload.about.trim();
  }
  if (payload.birthDate) profile.birthDate = payload.birthDate.trim();
  if (payload.gender !== undefined) {
    profile.gender = payload.gender.trim() || null;
  }

  // Handle avatar upload
  if (payload.avatarFile) {
    const { url, key } = await uploadFile(payload.avatarFile, { 
      folder: `avatars/${userId}` 
    });

    // Delete old avatar if exists
    if (profile.imageKey && profile.imageKey !== key) {
      try {
        await deleteFile(profile.imageKey);
      } catch (error) {
        console.error("Failed to delete old avatar:", error);
      }
    }

    profile.imageUrl = url;
    profile.imageKey = key;
  } else if (payload.removeAvatar) {
    if (profile.imageKey) {
      try {
        await deleteFile(profile.imageKey);
      } catch (error) {
        console.error("Failed to delete avatar:", error);
      }
    }
    profile.imageUrl = undefined;
    profile.imageKey = "";
  } else if (payload.imageUrl !== undefined) {
    const trimmed = payload.imageUrl?.trim?.() || "";
    profile.imageUrl = trimmed || undefined;
    if (!trimmed) profile.imageKey = "";
  }

  await profile.save();

  return {
    userId: user._id.toString(),
    username: user.username,
    profile,
  };
}
