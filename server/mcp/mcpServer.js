import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create MCP server
export const server = new McpServer({
  name: "weatherData",
  version: "1.0.0",
});

// --- Fake weather function ---
async function getWeatherByCityAndDate(city, startDate, endDate) {
  // Here you could later plug in a real weather API (e.g. OpenWeather)
  if (city.toLowerCase() === "london") {
    return {
      city,
      startDate,
      endDate,
      forecast: [
        { date: startDate, temp: "15C", condition: "Cloudy" },
        { date: endDate, temp: "17C", condition: "Light Rain" },
      ],
    };
  }
  if (city.toLowerCase() === "delhi") {
    return {
      city,
      startDate,
      endDate,
      forecast: [
        { date: startDate, temp: "32C", condition: "Sunny" },
        { date: endDate, temp: "34C", condition: "Hot & Dry" },
      ],
    };
  }
  return { error: `No weather data for ${city}` };
}

// --- Tool registry (to allow invokeTool) ---
const toolRegistry = new Map();

// ✅ Register tool using wrapper
function registerTool(name, schema, handler) {
  toolRegistry.set(name, handler);

  server.tool(name, schema, async (args) => {
    return handler(args);
  });
}

server.invokeTool = async (name, args) => {
  if (!toolRegistry.has(name)) {
    throw new Error(`Tool ${name} not registered`);
  }
  return toolRegistry.get(name)(args);
};

// --- Register getWeatherDataByCityName tool with startDate & endDate ---
registerTool(
  "getWeatherDataByCityName",
  {
    city: z.string(),
    startDate: z.string(), // e.g. "2025-10-01"
    endDate: z.string(),   // e.g. "2025-10-05"
  },
  async ({ city, startDate, endDate }) => {
    const result = await getWeatherByCityAndDate(city, startDate, endDate);
    console.error("DEBUG returning:", result);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  }
);

// --- Initialize MCP server ---
export async function initMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Weather MCP server running...");
}