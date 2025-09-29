// models/activityLog.js
import mongoose from "mongoose";

const activityLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // who performed the action
    },
    action: {
      type: String,
      required: true, // e.g., "Created Task", "Updated Project", "Deleted User"
    },
    entity: {
      type: String,
      required: true, // which entity was affected (e.g., "Task", "Project", "User")
    },
    entityId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true, // the specific document that was affected
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    details: {
      type: String, // optional: extra info like "Changed status from Pending to Completed"
      default: "",
    },
  },
  { timestamps: true }
);

const ActivityLog = mongoose.model(
  "ActivityLog",
  activityLogSchema,
  "activityLogs"
);

export default ActivityLog;
