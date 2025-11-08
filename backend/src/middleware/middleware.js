import { verifyToken } from "../lib/jwt.utils.js";

export function requireAuth(req, res, next) {
    try {
        const token = req.cookies?.authToken;
        if (!token) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        const payload = verifyToken(token);
        req.user = payload;
        return next();
    } catch (error) {
        return res.status(401).json({ message: error.message });
    }
}

