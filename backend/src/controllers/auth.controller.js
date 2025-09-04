import { signUpService, signInService } from "../services/auth.service.js";

export const signUp = async (req, res) => {
    try {
        //Bước 1: Nhận dữ liệu từ frontend
        const {username, password, familyName, givenName, birthDate, gender, imageUrl} = req.body;
        //Bước 2: Gọi service để tạo user và profile
        await signUpService(username, password, familyName, givenName, birthDate, gender, imageUrl);
        res.status(201).json({message: "Sign up successfully"});
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const signIn = async (req, res) => {
    try {
        //Bước 1: Nhận dữ liệu từ frontend
        const {username, password} = req.body;
        //Bước 2: Gọi service để đăng nhập
        const result = await signInService(username, password);
        
        if (!result.success) {
            return res.status(401).json({ message: result.message });
        }
        // Bước 3: Trả token về cho frontend
        res.status(200).json({
            message: "Sign in successfully",
            token: result.token,
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
}