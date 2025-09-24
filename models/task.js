// models/task.js
import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    priority: { type: String, enum: ["Low", "Medium", "High"], default: "Low" },
    status: {
      type: String,
      enum: ["Pending", "In Progress", "Completed"],
      default: "Pending",
    },
    dueDate: { type: Date },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    }, // link to user later
    tags: { type: [String], default: [] },
  },
  { timestamps: true }
); // createdAt and updatedAt added automatically

const Task = mongoose.model("Task", taskSchema, "tasks");
export default Task;
