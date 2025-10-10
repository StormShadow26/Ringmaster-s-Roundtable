import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import database from "./database/database.js";
import userRoutes from "./routes/user.routes.js";
import mcpRoutes from "./routes/mcp.routes.js";
import imageRoutes from "./routes/image.routes.js";
import placeRoutes from "./routes/place.routes.js";

import chatHistoryRoutes from "./routes/chatHistory.routes.js";
import multer from "multer";
import fs from "fs";


dotenv.config();

const app = express();
const PORT = 5000;

// Middleware
app.use(
  cors({
    origin: "http://localhost:5173", // allow frontend dev server
    credentials: true,
  })
);
app.use(express.json());

// Connect database
database.connect();

// Routes
app.use('/api/v1', userRoutes);
app.use('/api/v1/mcp', mcpRoutes);
app.use('/api/v1/chat-history', chatHistoryRoutes);

app.use("/api/users", imageRoutes);
app.use("/api/places", placeRoutes);

// Base route
app.get("/", (req, res) => res.send("📸 Image Gallery API Running"));

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


