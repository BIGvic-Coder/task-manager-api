// routes/tasks.js
import express from "express";
import { body, param, validationResult } from "express-validator";
import mongoose from "mongoose";
import Task from "../models/task.js";
import authenticateToken from "../middleware/auth.js"; // ✅ import auth middleware
import ActivityLog from "../models/activityLog.js"; // ✅ import activity logging

const router = express.Router();

// =======================
// GET all tasks (public)
// =======================
router.get("/", async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// =======================
// GET task by ID (public)
// =======================
router.get(
  "/:id",
  [param("id").custom((v) => mongoose.Types.ObjectId.isValid(v))],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.json(task);
    } catch (err) {
      next(err);
    }
  }
);

// =======================
// POST create task (protected)
// =======================
router.post(
  "/",
  authenticateToken, // ✅ only logged-in users
  [
    body("title").notEmpty().withMessage("title is required"),
    body("priority")
      .optional()
      .isIn(["Low", "Medium", "High"])
      .withMessage("invalid priority"),
    body("status")
      .optional()
      .isIn(["Pending", "In Progress", "Completed"])
      .withMessage("invalid status"),
    body("dueDate")
      .optional()
      .isISO8601()
      .toDate()
      .withMessage("dueDate must be a valid date"),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const task = new Task({
        ...req.body,
        owner: req.user.id, // ✅ link to logged-in user
      });
      await task.save();

      // ✅ log activity
      await ActivityLog.create({
        user: req.user.id,
        action: "Created Task",
        entity: "Task",
        entityId: task._id,
        details: `Task titled "${task.title}" created`,
      });

      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

// =======================
// PUT update task (protected)
// =======================
router.put(
  "/:id",
  authenticateToken,
  [
    param("id").custom((v) => mongoose.Types.ObjectId.isValid(v)),
    body("priority").optional().isIn(["Low", "Medium", "High"]),
    body("status").optional().isIn(["Pending", "In Progress", "Completed"]),
    body("dueDate").optional().isISO8601().toDate(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const updated = await Task.findOneAndUpdate(
        { _id: req.params.id, owner: req.user.id }, // ✅ only owner can update
        req.body,
        { new: true, runValidators: true }
      );

      if (!updated)
        return res
          .status(404)
          .json({ message: "Task not found or not authorized" });

      // ✅ log activity
      await ActivityLog.create({
        user: req.user.id,
        action: "Updated Task",
        entity: "Task",
        entityId: updated._id,
        details: `Task titled "${updated.title}" updated`,
      });

      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// =======================
// DELETE task (protected)
// =======================
router.delete(
  "/:id",
  authenticateToken,
  [param("id").custom((v) => mongoose.Types.ObjectId.isValid(v))],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const deleted = await Task.findOneAndDelete({
        _id: req.params.id,
        owner: req.user.id, // ✅ only owner can delete
      });

      if (!deleted)
        return res
          .status(404)
          .json({ message: "Task not found or not authorized" });

      // ✅ log activity
      await ActivityLog.create({
        user: req.user.id,
        action: "Deleted Task",
        entity: "Task",
        entityId: req.params.id,
        details: `Task deleted by user`,
      });

      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
