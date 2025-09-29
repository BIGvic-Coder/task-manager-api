// models/project.js
import mongoose from "mongoose";

const projectSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true, // project must belong to a user
    },
    members: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // users who are part of this project
      },
    ],
    tasks: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task", // tasks linked to this project
      },
    ],
    status: {
      type: String,
      enum: ["Active", "On Hold", "Completed"],
      default: "Active",
    },
  },
  { timestamps: true }
);

const Project = mongoose.model("Project", projectSchema, "projects");

export default Project;
