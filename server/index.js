import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import database from "./database/database.js";
import userRoutes from "./routes/user.routes.js";

dotenv.config();

const app = express();
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

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});




import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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
  return { error: `No weather data for ${city}`};
}

// Tool definition
server.tool(
  "getWeatherDataByCityName",
  {
    city: z.string(),
  },
  async ({ city }) => {
    const result = await getWeatherByCity(city);

    // Force log to debug
    console.error("DEBUG returning:", result);

    // ✅ Only "text" is valid — stringify JSON manually
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result), // single line string works better
        },
      ],
    };
  }
);



// Init
async function init() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Weather MCP server running...");
}

init();