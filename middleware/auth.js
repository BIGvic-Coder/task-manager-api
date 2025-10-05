// middleware/auth.js
import jwt from "jsonwebtoken";

/**
 * Middleware to verify JWT and protect routes.
 * Looks for a Bearer token in the Authorization header.
 */
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader?.split(" ")[1]; // Expecting "Bearer <token>"

    if (!token) {
      return res
        .status(401)
        .json({ success: false, message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // attach decoded payload (e.g. userId, role) to request object
    req.user = decoded;

    next();
  } catch (err) {
    console.error("❌ JWT verification failed:", err.message);

    // Differentiate expired tokens vs invalid tokens (good for demo video)
    if (err.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({
          success: false,
          message: "Token expired. Please log in again.",
        });
    }

    res
      .status(403)
      .json({ success: false, message: "Invalid or malformed token." });
  }
};

export default authenticateToken;
