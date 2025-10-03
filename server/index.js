<<<<<<< Updated upstream
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import database from "./database/database.js";
import userRoutes from "./routes/user.routes.js";
import mcpRoutes from "./routes/mcp.routes.js";
import { initMcpServer } from "./mcp/mcpServer.js";

dotenv.config();
=======
// mcp-server.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import express from "express";
import cors from "cors";
>>>>>>> Stashed changes

const server = new McpServer({
  name: "weatherData",
  version: "1.0.0",
});

// Fake weather function
async function getWeatherByCity(city) {
  if (city.toLowerCase() === "london") {
    return { temp: "15C", condition: "Cloudy" };
  }
  if (city.toLowerCase() === "delhi") {
    return { temp: "32C", condition: "Sunny" };
  }
  return { error: `No weather data for ${city}` };
}

// MCP tool definition
server.tool(
  "getWeatherDataByCityName",
  {
    city: z.string(),
  },
  async ({ city }) => {
    const result = await getWeatherByCity(city);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result),
        },
      ],
    };
  }
);

// Start MCP transport (stdio for MCP clients)
async function initMCP() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Weather MCP server running...");
}
initMCP();

// 👉 Add Express wrapper so React frontend can call it
const app = express();
<<<<<<< Updated upstream
const PORT = 5000;

// Middleware
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Connect database
database.connect();

// Routes
app.use('/api/v1', userRoutes);
app.use('/api/v1/mcp', mcpRoutes);

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
=======
app.use(express.json());

app.use(cors());

app.get("/", (req, res) => {
  res.send("CORS enabled for all origins!");
});

app.post("/getWeather", async (req, res) => {
  const { city } = req.body;
  const result = await getWeatherByCity(city);
  res.json(result);
});

app.listen(4000, () => {
  console.log("✅ HTTP server running on http://localhost:4000");
>>>>>>> Stashed changes
});

// Start MCP server separately
initMcpServer()
