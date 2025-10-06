// index.js
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import session from "express-session";
import swaggerUi from "swagger-ui-express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import passport from "passport";
import "./config/passport.js";

// ==========================
// 🧩 Import Routes
// ==========================
import usersRouter from "./routes/users.js";
import tasksRouter from "./routes/tasks.js";
import authRouter from "./routes/auth.js"; // ✅ Added back
// import activityLogsRouter from "./routes/activityLogs.js"; // optional

const app = express();

// ==========================
// 📂 Fix __dirname for ES modules
// ==========================
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ==========================
// 🧩 Middleware Setup
// ==========================
app.use(
  cors({
    origin: "*", // change to frontend URL in production
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "secret-key",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

// ==========================
// 📘 Swagger Setup
// ==========================
const swaggerPath = path.join(__dirname, "swagger.json");
let swaggerDocument = {};

try {
  swaggerDocument = JSON.parse(fs.readFileSync(swaggerPath, "utf-8"));
} catch (err) {
  console.error("⚠️ Could not load swagger.json:", err.message);
}

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ==========================
// 🌐 MongoDB Connection
// ==========================
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("✅ Connected to MongoDB"))
  .catch((err) => console.error("❌ MongoDB connection error:", err));

// ==========================
// 🛣️ Route Mounting
// ==========================
app.use("/api/users", usersRouter);
app.use("/api/tasks", tasksRouter);
app.use("/api/auth", authRouter); // ✅ Enabled authentication routes
// app.use("/api/activity-logs", activityLogsRouter); // optional

// ==========================
// 🏠 Root Endpoint
// ==========================
app.get("/", (req, res) => {
  res.send("✅ Task Manager API running. Visit /api-docs for Swagger UI.");
});

// ==========================
// ⚠️ Global Error Handler
// ==========================
app.use((err, req, res, next) => {
  console.error("🔥 Error:", err.stack);
  res.status(500).json({
    success: false,
    message: "Internal Server Error",
    error: err.message,
  });
});

// ==========================
// 🚀 Start Server
// ==========================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📘 Swagger UI: http://localhost:${PORT}/api-docs`);
  console.log(
    `🔑 Using Google Callback URL: ${process.env.GOOGLE_CALLBACK_URL}`
  );
});
