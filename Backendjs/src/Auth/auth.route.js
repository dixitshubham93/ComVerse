import express from "express";
import passport from "passport";
import "./google.strategy.js";
import { register, login } from "./auth.controller.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

router.get(
  "/google/callback",
  (req, res, next) => {
    passport.authenticate("google", { session: false }, (err, user, info) => {
      const frontendUrl = process.env.FRONTEND_URL;

      if (!frontendUrl) {
        return next(new Error("FRONTEND_URL is not defined"));
      }

      if (err || !user) {
        const message = err?.message || "Authentication failed";
        return res.redirect(`${frontendUrl}/?error=${encodeURIComponent(message)}`);
      }

      // Encode user data as URL parameters
      const token = user.token;
      const userData = encodeURIComponent(JSON.stringify(user.user));

      res.redirect(
        `${frontendUrl}/?token=${token}&user=${userData}`
      );
    })(req, res, next);
  }
);


export default router;
