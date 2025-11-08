import jwt from "jsonwebtoken";

export function generateToken(payload, options = {}) {
    const {
        expiresIn = "7d",
        secret = process.env.JWT_SECRET
    } = options;

    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }

    try {
        return jwt.sign(payload, secret, { expiresIn });
    } catch (error) {
        throw new Error(`Token generation failed: ${error.message}`);
    }
}


export function verifyToken(token, secret = process.env.JWT_SECRET) {
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }

    if (!token) {
        throw new Error("Token is required");
    }

    try {
        return jwt.verify(token, secret);
    } catch (error) {
        if (error.name === 'TokenExpiredError') {
            throw new Error("Token has expired");
        }
        if (error.name === 'JsonWebTokenError') {
            throw new Error("Invalid token");
        }
        throw new Error(`Token verification failed: ${error.message}`);
    }
}


export function decodeToken(token) {
    if (!token) {
        throw new Error("Token is required");
    }

    try {
        return jwt.decode(token);
    } catch (error) {
        throw new Error(`Token decode failed: ${error.message}`);
    }
}


export function generateRefreshToken(payload) {
    return generateToken(payload, { expiresIn: "30d" });
}
