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

import quizService from './services/quizService.js';
import initializeQuizScheduler from './cron/quizScheduler.js';
import  Quiz  from './models/quiz.model.js';

dotenv.config();

const app = express();
const PORT = 5000;

// Create HTTP server and integrate Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
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

// Initialize quiz services
quizService.init(io);
initializeQuizScheduler();

// Routes
app.use('/api/v1', userRoutes);
app.use('/api/v1/mcp', mcpRoutes);
app.use('/api/v1/chat-history', chatHistoryRoutes);
app.use('/api/v1/quiz', quizRoutes);

// Socket.IO connection handling
io.on('connection', async (socket) => {
    console.log(`User Connected: ${socket.id}`);

    try {
        const liveQuiz = await Quiz.findOne({ status: 'live' });

        if (liveQuiz) {
            const startTime = new Date(liveQuiz.startTime).getTime();
            const elapsedTimeMs = Date.now() - startTime;
            let cumulativeTime = 0;
            let currentQuestion = null;

            for (let i = 0; i < liveQuiz.questions.length; i++) {
                const question = liveQuiz.questions[i];
                const questionDuration = (question.timeLimit * 1000) + 500;
                if (elapsedTimeMs < cumulativeTime + questionDuration) {
                    currentQuestion = {
                        index: i,
                        questionText: question.questionText,
                        options: question.options,
                        timeLimit: question.timeLimit,
                    };
                    break;
                }
                cumulativeTime += questionDuration;
            }

            if (currentQuestion) {
                console.log(`A quiz is in progress. Sending current question to ${socket.id}`);
                socket.emit('new_question', currentQuestion);
            }
        }
    } catch (error) {
        console.error("Error handling new connection for live quiz:", error);
    }

    // Pass the socket instance to the service for direct replies
    socket.on('submit_answer', (data) => {
        quizService.handleAnswer(socket, data);
    });

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});


// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});