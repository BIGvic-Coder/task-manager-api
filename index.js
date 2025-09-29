// server.js
import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import cors from "cors";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport"; // ✅ import passport for OAuth

// Routes
import usersRouter from "./routes/users.js";
import tasksRouter from "./routes/tasks.js";
import authRouter from "./routes/auth.js";
import activityLogsRouter from "./routes/activityLogs.js"; // ✅ import activity logs

dotenv.config();
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

// ✅ initialize passport (for Google OAuth)
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
app.use("/activity-logs", activityLogsRouter); // ✅ register activity logs router

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
