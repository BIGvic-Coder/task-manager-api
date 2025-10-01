// index.js
import dotenv from "dotenv";
dotenv.config(); // ✅ must be at the very top before other imports
console.log("🔑 Google callback URL in use:", process.env.GOOGLE_CALLBACK_URL);

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport"; // ✅ import passport for OAuth + JWT
import jwt from "jsonwebtoken"; // ✅ JWT for token handling
import "./config/passport.js"; // ✅ load passport config here

// Routes
import usersRouter from "./routes/users.js";
import tasksRouter from "./routes/tasks.js";
import authRouter from "./routes/auth.js";
import activityLogsRouter from "./routes/activityLogs.js";

const app = express();

// Workaround for __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(
  cors({
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);
app.use(express.json());

// ✅ initialize passport (for Google OAuth + JWT)
app.use(passport.initialize());

// Swagger setup
const swaggerPath = path.join(__dirname, "swagger.json");
let swaggerDocument = {};
try {
  swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));
} catch (err) {
  console.error("⚠️ Could not load swagger.json:", err.message);
}
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// Routes
app.use("/users", usersRouter);
app.use("/tasks", tasksRouter);
app.use("/auth", authRouter);
app.use("/activity-logs", activityLogsRouter);

// ✅ Protected route (test JWT authentication)
app.get(
  "/protected",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    res.json({
      success: true,
      message: "You have access to this protected route 🎉",
      user: req.user,
    });
  }
);

// Root route
app.get("/", (req, res) => {
  res.send("✅ Task Manager API is running. Visit /api-docs for Swagger UI.");
});

// Global error handler
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Server error",
    error: err.message,
  });
});

// Start server
const PORT = process.env.PORT || 8080;
app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
