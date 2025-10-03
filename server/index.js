import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import database from "./database/database.js";
import userRoutes from "./routes/user.routes.js";
import mcpRoutes from "./routes/mcp.routes.js";
import { initMcpServer } from "./mcp/mcpServer.js";



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
app.use("/api/v1", userRoutes);
app.use("/api/v1/mcp", mcpRoutes);

// Simple test endpoint
app.get("/", (req, res) => {
  res.send("CORS enabled for all origins!");
});

// Optional direct weather route for debugging
app.post("/getWeather", async (req, res) => {
  const { city } = req.body;
  const result = await getWeatherByCity(city);
  res.json(result);
});

// Start Express server
app.listen(PORT, () => {
  console.log(`🚀 Express server running on http://localhost:${PORT}`);
});

// ✅ Start your custom MCP server (from /mcp/mcpServer.js)
initMcpServer();