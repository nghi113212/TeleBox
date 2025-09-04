import User from "../models/User.model.js";
import Profile from "../models/Profile.model.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

export async function signUpService(username, password, familyName, givenName, birthDate, gender, imageUrl) {
    try{
        //Bước 1: Check if username is already taken    => Password bên frontend nhớ đủ 6 ký tự, hoa thường, đặc biệt,...
        const existingUser = await User.findOne({username});
        if (existingUser) {
            throw new Error("Username already taken");
        }
        
        //Bước 2: Hash password và tạo user
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({username, password: hashedPassword});
        
        //Bước 3: Tạo profile của user đó   => Notes: BirthDate nhớ xử lý bên frontend
        const profile = await Profile.create({familyName, givenName, birthDate, gender, imageUrl});
        user.profile = profile._id;
        await user.save();

    } catch (error) {
        throw error;
    }
}

export async function signInService(username, password) {
    try {
        const user = await User.findOne({ username });
        if (!user) {
            throw new Error("Invalid username or password");
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            throw new Error("Invalid username or password");
        }

        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        return { success: true, token};
    } catch (error) {
        return { success: false, message: error.message };
    }
}
      