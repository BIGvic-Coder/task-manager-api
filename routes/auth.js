// routes/auth.js
import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { body, validationResult } from "express-validator";
import passport from "passport";
import "../config/passport.js"; // make sure you have a Google OAuth strategy setup
import User from "../models/user.js";

const router = express.Router();

/**
 * POST /auth/register
 * Register a new user
 */
router.post(
  "/register",
  [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("password")
      .isLength({ min: 6 })
      .withMessage("Password must be at least 6 characters"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { name, email, password } = req.body;

      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      // Create new user
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user",
      });

      res.status(201).json({ id: user._id, email: user.email });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /auth/login
 * Login with email + password
 */
router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required"),
    body("password").notEmpty().withMessage("Password is required"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const { email, password } = req.body;

      // Check user
      const user = await User.findOne({ email });
      if (!user)
        return res.status(401).json({ message: "Invalid email or password" });

      // Compare password
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch)
        return res.status(401).json({ message: "Invalid email or password" });

      // Create token
      const token = jwt.sign(
        { id: user._id, role: user.role },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
      );

      res.json({ token });
    } catch (err) {
      next(err);
    }
  }
);

/**
 * GET /auth/google
 * Start Google OAuth login
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * GET /auth/google/callback
 * Handle Google OAuth response
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/auth/failure",
  }),
  (req, res) => {
    const user = req.user;
    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    // respond with token (API style)
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  }
);

// Failure route
router.get("/failure", (req, res) => {
  res.status(401).json({ message: "OAuth login failed" });
});

export default router;
