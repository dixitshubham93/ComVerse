import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { oauthLogin } from "./auth.service.js";

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
    },
    async (_, __, profile, done) => {
      try {
        const token = await oauthLogin({
          email: profile.emails[0].value,
          username: profile.displayName,
          avatarUrl: profile.photos?.[0]?.value,
        });

        done(null, { token });
      } catch (err) {
        done(err, null);
      }
    }
  )
);
