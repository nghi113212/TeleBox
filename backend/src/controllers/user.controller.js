import { signUpService } from "../services/auth.service.js";

export const signUp = async (req, res) => {
    try {
        //Bước 1: Nhận dữ liệu từ frontend
        const {username, password, familyName, givenName, birthDate, gender, imageUrl} = req.body;
        //Bước 2: Gọi service để tạo user và profile
        await signUpService(username, password, familyName, givenName, birthDate, gender, imageUrl);
        res.status(201).json({message: "Sign up successfully"});
    } catch (error) {
        res.status(500).json({message: error.message});
    }
}