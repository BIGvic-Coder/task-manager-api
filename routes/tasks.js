// routes/tasks.js
import express from "express";
import { body, param, validationResult } from "express-validator";
import mongoose from "mongoose";
import Task from "../models/task.js";
import authenticateToken from "../middleware/auth.js";
import ActivityLog from "../models/activityLog.js";

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Tasks
 *   description: Endpoints for managing user tasks
 */

/**
 * @swagger
 * /api/tasks:
 *   get:
 *     summary: Get all tasks
 *     tags: [Tasks]
 *     responses:
 *       200:
 *         description: List of all tasks
 */
router.get("/", async (req, res, next) => {
  try {
    const tasks = await Task.find().sort({ createdAt: -1 });
    res.status(200).json(tasks);
  } catch (err) {
    next(err);
  }
});

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     summary: Get a task by ID
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       200:
 *         description: Task found
 *       404:
 *         description: Task not found
 */
router.get(
  "/:id",
  [param("id").custom((v) => mongoose.Types.ObjectId.isValid(v))],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const task = await Task.findById(req.params.id);
      if (!task) return res.status(404).json({ message: "Task not found" });
      res.status(200).json(task);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/tasks:
 *   post:
 *     summary: Create a new task (requires authentication)
 *     tags: [Tasks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               description:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               status:
 *                 type: string
 *                 enum: [Pending, In Progress, Completed]
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       201:
 *         description: Task created successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 */
router.post(
  "/",
  authenticateToken,
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
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const task = new Task({
        ...req.body,
        owner: req.user.id,
      });
      await task.save();

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

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     summary: Update an existing task (requires authentication)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               priority:
 *                 type: string
 *                 enum: [Low, Medium, High]
 *               status:
 *                 type: string
 *                 enum: [Pending, In Progress, Completed]
 *               dueDate:
 *                 type: string
 *                 format: date
 *     responses:
 *       200:
 *         description: Task updated successfully
 *       400:
 *         description: Validation error
 *       404:
 *         description: Task not found or unauthorized
 */
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
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const updated = await Task.findOneAndUpdate(
        { _id: req.params.id, owner: req.user.id },
        req.body,
        { new: true, runValidators: true }
      );

      if (!updated)
        return res
          .status(404)
          .json({ message: "Task not found or not authorized" });

      await ActivityLog.create({
        user: req.user.id,
        action: "Updated Task",
        entity: "Task",
        entityId: updated._id,
        details: `Task titled "${updated.title}" updated`,
      });

      res.status(200).json(updated);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     summary: Delete a task (requires authentication)
 *     tags: [Tasks]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Task ID
 *     responses:
 *       204:
 *         description: Task deleted successfully
 *       404:
 *         description: Task not found or unauthorized
 */
router.delete(
  "/:id",
  authenticateToken,
  [param("id").custom((v) => mongoose.Types.ObjectId.isValid(v))],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const deleted = await Task.findOneAndDelete({
        _id: req.params.id,
        owner: req.user.id,
      });

      if (!deleted)
        return res
          .status(404)
          .json({ message: "Task not found or not authorized" });

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
