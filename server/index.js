import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import database from "./database/database.js";
import userRoutes from "./routes/user.routes.js";
import mcpRoutes from "./routes/mcp.routes.js";




dotenv.config();

// 👉 Add Express wrapper so React frontend can call it
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});


