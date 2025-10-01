// checkEnv.js
import "dotenv/config";

console.log("MONGO_URI:", process.env.MONGO_URI ? "✅ loaded" : "❌ missing");
console.log("JWT_SECRET:", process.env.JWT_SECRET ? "✅ loaded" : "❌ missing");
console.log("GOOGLE_CLIENT_ID:", process.env.GOOGLE_CLIENT_ID || "❌ missing");
console.log(
  "GOOGLE_CLIENT_SECRET:",
  process.env.GOOGLE_CLIENT_SECRET ? "✅ loaded" : "❌ missing"
);
console.log(
  "GOOGLE_CALLBACK_URL:",
  process.env.GOOGLE_CALLBACK_URL || "❌ missing"
);
