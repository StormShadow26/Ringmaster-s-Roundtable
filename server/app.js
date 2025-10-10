import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";

import database from "./database/database.js";
import userRoutes from "./routes/user.routes.js";
import mcpRoutes from "./routes/mcp.routes.js";
import chatHistoryRoutes from "./routes/chatHistory.routes.js";
import quizRoutes from "./routes/quiz.routes.js";
import geminiRoutes from "./routes/gemini.routes.js";

import quizService from "./services/quizService.js";
import initializeQuizScheduler from "./cron/quizScheduler.js";
import Quiz from "./models/quiz.model.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server and integrate Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

// Connect database
database.connect();

// Initialize quiz services and cron
quizService.init(io);
initializeQuizScheduler();

// API Routes
app.use("/api/v1", userRoutes);
app.use("/api/v1/mcp", mcpRoutes);
app.use("/api/v1/chat-history", chatHistoryRoutes);
app.use("/api/v1/quiz", quizRoutes);
app.use("/api/v1/gemini", geminiRoutes);

// 🧠 Socket.IO logic
io.on("connection", async (socket) => {
  console.log(`✅ User Connected: ${socket.id}`);

  try {
    console.log("🔍 Checking for live quiz...");
    const liveQuiz = await Quiz.findOne({ status: "live" });

    if (!liveQuiz) {
      console.log("❌ No live quiz found.");
      socket.emit("no_active_quiz", { message: "No quiz is currently live." });
      return;
    }

    // Validate startTime
    if (!liveQuiz.startTime) {
      console.log("⚠️ Live quiz found but startTime is missing.");
      socket.emit("quiz_error", { message: "Quiz start time not found." });
      return;
    }

    const startTime = new Date(liveQuiz.startTime).getTime();
    const now = Date.now();
    const elapsedTimeMs = now - startTime;

    console.log(`📅 Quiz started at: ${liveQuiz.startTime}`);
    console.log(`⏱️ Elapsed time since quiz start: ${elapsedTimeMs} ms`);

    let cumulativeTime = 0;
    let currentQuestion = null;

    // Loop through questions to find which one is currently active
    for (let i = 0; i < liveQuiz.questions.length; i++) {
      const question = liveQuiz.questions[i];
      const questionDuration = (question.timeLimit * 1000) + 500;

      console.log(`👉 Checking Q${i + 1}: duration ${questionDuration}ms`);

      if (elapsedTimeMs < cumulativeTime + questionDuration) {
        currentQuestion = {
          index: i,
          questionText: question.questionText,
          options: question.options,
          timeLimit: question.timeLimit,
        };
        console.log(`✅ Current question determined: Q${i + 1}`);
        break;
      }

      cumulativeTime += questionDuration;
    }

    if (currentQuestion) {
      console.log(`📤 Sending current question (Q${currentQuestion.index + 1}) to ${socket.id}`);
      socket.emit("new_question", currentQuestion);
    } else {
      console.log("⚠️ No active question — all questions may have finished.");
      socket.emit("quiz_ended", { message: "Quiz has already finished." });
    }
  } catch (error) {
    console.error("❌ Error handling new connection for live quiz:", error);
    socket.emit("quiz_error", { message: "Internal server error while joining live quiz." });
  }

  // 🧩 Handle answer submission
  socket.on("submit_answer", (data) => {
    console.log(`📥 Received answer from ${socket.id}:`, data);
    quizService.handleAnswer(socket, data);
  });

  // ❌ Handle disconnect
  socket.on("disconnect", () => {
    console.log(`❌ User Disconnected: ${socket.id}`);
  });
});

// 🚀 Start the server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
