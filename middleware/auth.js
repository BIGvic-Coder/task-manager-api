// middleware/auth.js
import jwt from "jsonwebtoken";

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1]; // "Bearer <token>"

  if (!token) {
    return res
      .status(401)
      .json({ message: "Access denied. No token provided." });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // decoded token payload (user id, role, etc.)
    next();
  } catch (err) {
    return res.status(403).json({ message: "Invalid or expired token." });
  }
};

export default authenticateToken;
