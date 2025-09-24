// routes/tasks.js
import express from "express";
import { body, param, validationResult } from "express-validator";
import Task from "../models/task.js";
import mongoose from "mongoose";

const router = express.Router();

// GET all tasks
router.get("/", async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.json(tasks);
  } catch (err) {
    next(err);
  }
});

// GET task by ID
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

// POST create task
router.post(
  "/",
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
      const task = new Task(req.body);
      await task.save();
      res.status(201).json(task);
    } catch (err) {
      next(err);
    }
  }
);

// PUT update task
router.put(
  "/:id",
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
      const updated = await Task.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!updated) return res.status(404).json({ message: "Task not found" });
      res.json(updated);
    } catch (err) {
      next(err);
    }
  }
);

// DELETE task
router.delete(
  "/:id",
  [param("id").custom((v) => mongoose.Types.ObjectId.isValid(v))],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      const deleted = await Task.findByIdAndDelete(req.params.id);
      if (!deleted) return res.status(404).json({ message: "Task not found" });
      res.sendStatus(204);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
