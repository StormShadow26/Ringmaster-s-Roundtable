import express from "express";
import * as userController from "../controllers/user.controller.js";

const router = express.Router();

// Local Auth
router.post("/register", userController.register);
router.post("/login", userController.login);

// Google OAuth
router.post("/google", userController.googleAuth);

export default router;
