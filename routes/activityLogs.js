// routes/activityLogs.js
import express from "express";
import { body, param, validationResult } from "express-validator";
import mongoose from "mongoose";
import ActivityLog from "../models/activityLog.js";
import authenticateToken from "../middleware/auth.js";

const router = express.Router();

/**
 * GET /activity-logs
 * Get all activity logs (requires JWT, admin-only)
 */
router.get("/", authenticateToken, async (req, res, next) => {
  try {
    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied. Admins only." });
    }

    const logs = await ActivityLog.find()
      .populate("user", "name email")
      .sort({ createdAt: -1 });

    res.json(logs);
  } catch (err) {
    next(err);
  }
});

/**
 * GET /activity-logs/:id
 * Get a specific activity log by ID
 */
router.get(
  "/:id",
  authenticateToken,
  [param("id").custom((v) => mongoose.Types.ObjectId.isValid(v))],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
      }

      const log = await ActivityLog.findById(req.params.id).populate(
        "user",
        "name email"
      );

      if (!log)
        return res.status(404).json({ message: "ActivityLog not found" });

      res.json(log);
    } catch (err) {
      next(err);
    }
  }
);

/**
 * POST /activity-logs
 * Manually create a log entry (requires JWT, admin-only)
 */
router.post(
  "/",
  authenticateToken,
  [
    body("action").notEmpty().withMessage("Action is required"),
    body("entity").notEmpty().withMessage("Entity is required"),
    body("entityId").custom((v) => mongoose.Types.ObjectId.isValid(v)),
    body("details").optional().isString(),
  ],
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty())
      return res.status(400).json({ errors: errors.array() });

    try {
      if (req.user.role !== "admin") {
        return res.status(403).json({ message: "Access denied. Admins only." });
      }

      const log = new ActivityLog({
        user: req.user.id,
        action: req.body.action,
        entity: req.body.entity,
        entityId: req.body.entityId,
        details: req.body.details || "",
      });

      await log.save();
      res.status(201).json(log);
    } catch (err) {
      next(err);
    }
  }
);

export default router;
