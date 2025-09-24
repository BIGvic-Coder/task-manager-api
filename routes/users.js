// routes/users.js
import express from "express";
import { body, validationResult } from "express-validator";
import User from "../models/user.js";

const router = express.Router();

// GET all users
router.get("/", async (req, res, next) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    next(err);
  }
});

// POST create user
router.post(
  "/",
  [
    body("username")
      .isLength({ min: 2 })
      .withMessage("username must be at least 2 chars"),
    body("email").isEmail().withMessage("valid email required"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const user = new User(req.body);
      await user.save();
      res.status(201).json(user);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
