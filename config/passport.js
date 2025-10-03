import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import User from "../models/user.js";

// Decide callback URL based on environment
const callbackURL =
  process.env.NODE_ENV === "production"
    ? process.env.GOOGLE_CALLBACK_URL_PROD
    : process.env.GOOGLE_CALLBACK_URL_LOCAL;

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL,
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        // Try to find existing OAuth user
        let user = await User.findOne({
          oauthProvider: "google",
          oauthId: profile.id,
        });

        if (!user) {
          // If not found, check if the email already exists (regular account)
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            // Link existing user with Google
            user.oauthProvider = "google";
            user.oauthId = profile.id;
            await user.save();
          } else {
            // Create new OAuth user (no password required now)
            user = await User.create({
              name: profile.displayName,
              email: profile.emails[0].value,
              oauthProvider: "google",
              oauthId: profile.id,
              role: "user",
            });
          }
        }

        return done(null, user);
      } catch (err) {
        return done(err, null);
      }
    }
  )
);

passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
