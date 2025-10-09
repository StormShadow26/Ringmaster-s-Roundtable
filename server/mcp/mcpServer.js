// mcpServer.js - Modular MCP Server Entry Point
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

// Import services
import { getWeatherByCityAndDate } from './services/weatherService.js';
import { planTripBasedOnWeather } from './services/travelPlannerService.js';
import { getEventsForTrip } from './services/eventsService.js';

// Create MCP server
export const server = new McpServer({
  name: "weatherData",
  version: "1.0.0",
});

// --- Tool registry ---
const toolRegistry = new Map();
function registerTool(name, schema, handler) {
  toolRegistry.set(name, handler);
  server.tool(name, schema, async (args) => {
    return handler(args);
  });
}

server.invokeTool = async (name, args) => {
  if (!toolRegistry.has(name)) throw new Error(`Tool ${name} not registered`);
  return toolRegistry.get(name)(args);
};

// --- Register getWeatherDataByCityName tool ---
registerTool(
  "getWeatherDataByCityName",
  {
    city: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  },
  async ({ city, startDate, endDate }) => {
    const result = await getWeatherByCityAndDate(city, startDate, endDate);
    console.log("DEBUG weather returning:", result);

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

// --- Register planTripBasedOnWeather tool ---
registerTool(
  "planTripBasedOnWeather",
  {
    city: z.string(),
    startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
    endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD"),
  },
  async ({ city, startDate, endDate }) => {
    // First get weather data
    const weatherData = await getWeatherByCityAndDate(city, startDate, endDate);
    
    // Then plan trip based on weather
    const travelPlan = await planTripBasedOnWeather(city, weatherData);
    console.log("DEBUG travel plan returning:", travelPlan);

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(travelPlan, null, 2),
        },
      ],
    };
  }
);

// --- Initialize MCP server ---
export async function initMcpServer() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.log("✅ Weather MCP server running...");
  console.log("📁 Modular architecture loaded:");
  console.log("   🔧 Config: Environment & API keys");
  console.log("   🛠️ Utils: Cache, Rate limiting, Validators");
  console.log("   🌐 APIs: Google Places, Foursquare, Ticketmaster, Eventbrite");
  console.log("   📊 Services: Weather, Attractions, Events, Travel Planner");
  console.log("   📚 Data: Curated events & city attractions database");
}

initMcpServer();