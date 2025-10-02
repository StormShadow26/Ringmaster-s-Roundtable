import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Create MCP server
export const server = new McpServer({
  name: "weatherData",
  version: "1.0.0",
});

// --- Fake weather function ---
async function getWeatherByCity(city) {
  if (city.toLowerCase() === "london") {
    return { temp: "15C", condition: "Cloudy" };
  }
  if (city.toLowerCase() === "delhi") {
    return { temp: "32C", condition: "Sunny" };
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

// ✅ Function to invoke tool manually
server.invokeTool = async (name, args) => {
  if (!toolRegistry.has(name)) {
    throw new Error(`Tool ${name} not registered`);
  }
  return toolRegistry.get(name)(args);
};

// --- Register our weather tool once ---
registerTool(
  "getWeatherDataByCityName",
  {
    city: z.string(),
  },
  async ({ city }) => {
    const result = await getWeatherByCity(city);
    console.error("DEBUG returning:", result);

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

// --- Initialize MCP server ---
export async function initMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("✅ Weather MCP server running...");
}
