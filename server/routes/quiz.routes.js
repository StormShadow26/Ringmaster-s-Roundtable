import express from "express";
import { createQuiz, getActiveQuiz } from "../controllers/quiz.controller.js";

const router = express.Router();

// Route to get the currently active or next scheduled quiz
// METHOD: GET
// ENDPOINT: /api/v1/quiz/active
router.get("/active", getActiveQuiz);

// Route to create a new quiz using Postman or an admin panel
// METHOD: POST
// ENDPOINT: /api/v1/quiz/
router.post("/", createQuiz);

export default router;