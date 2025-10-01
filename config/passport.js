// config/passport.js
import dotenv from "dotenv";
dotenv.config(); // Load environment variables from .env

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID, // from .env
      clientSecret: process.env.GOOGLE_CLIENT_SECRET, // from .env
      callbackURL: process.env.GOOGLE_CALLBACK_URL, // from .env
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // For now just return the Google profile
        return done(null, profile);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

// Serialize & deserialize (optional, useful for sessions)
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj, done) => {
  done(null, obj);
});

export default passport; // ✅ make sure to export passport
