// config/passport.js
import dotenv from "dotenv";
dotenv.config();

import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import User from "../models/user.js";

// ---------------- GOOGLE STRATEGY ----------------
// ✅ Automatically choose correct callback for local vs. production
const GOOGLE_CALLBACK_URL_FINAL =
  process.env.GOOGLE_CALLBACK_URL ||
  process.env.GOOGLE_CALLBACK_URL_PROD ||
  "http://localhost:8080/auth/google/callback";

console.log("🔑 Using Google Callback URL:", GOOGLE_CALLBACK_URL_FINAL);

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: GOOGLE_CALLBACK_URL_FINAL,
      passReqToCallback: true,
    },
    async (req, accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          oauthProvider: "google",
          oauthId: profile.id,
        });

        if (!user) {
          // Check if a user already exists with the same email
          user = await User.findOne({ email: profile.emails[0].value });

          if (user) {
            user.oauthProvider = "google";
            user.oauthId = profile.id;
            await user.save();
          } else {
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

// ---------------- JWT STRATEGY ----------------
const jwtOptions = {
  jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
  secretOrKey: process.env.JWT_SECRET,
};

passport.use(
  new JwtStrategy(jwtOptions, async (jwt_payload, done) => {
    try {
      const user = await User.findById(jwt_payload.id);
      if (user) return done(null, user);
      return done(null, false);
    } catch (err) {
      return done(err, false);
    }
  })
);

passport.serializeUser((user, done) => done(null, user.id));

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

export default passport;
