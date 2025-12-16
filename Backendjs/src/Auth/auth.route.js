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
  passport.authenticate("google", { session: false }),
  (req, res) => {
    const frontendUrl = process.env.FRONTEND_URL;

    if (!frontendUrl) {
      throw new Error("FRONTEND_URL is not defined");
    }

    res.redirect(
      `${frontendUrl}/auth/success?token=${req.user.token}`
    );
  }
);


export default router;
