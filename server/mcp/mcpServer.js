// backend/mcp/mcpServer.js
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import fetch from "node-fetch"; // only needed if Node <18
import dotenv from "dotenv";

dotenv.config();

const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
if (!OPENWEATHER_API_KEY) {
  throw new Error("OPENWEATHER_API_KEY not set in .env");
}

// Create MCP server
export const server = new McpServer({
  name: "weatherData",
  version: "1.0.0",
});

// --- Real Weather Fetcher ---
async function getWeatherByCityAndDate(city, startDate, endDate) {
  try {
    // Validate dates
    if (isNaN(Date.parse(startDate)) || isNaN(Date.parse(endDate))) {
      return { error: "Invalid date format. Use YYYY-MM-DD." };
    }
    if (startDate > endDate) {
      return { error: "startDate cannot be after endDate." };
    }

    // 1️⃣ Get coordinates of the city
    const geoRes = await fetch(
      `https://api.openweathermap.org/geo/1.0/direct?q=${encodeURIComponent(
        city
      )}&limit=1&appid=${OPENWEATHER_API_KEY}`
    );
    const geoData = await geoRes.json();
    if (!geoData || geoData.length === 0) {
      return { error: `City not found: ${city}` };
    }
    const { lat, lon } = geoData[0];

    // 2️⃣ Get 5-day / 3-hour forecast
    const weatherRes = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const weatherData = await weatherRes.json();
    if (!weatherData?.list) {
      return { error: "Failed to fetch forecast data" };
    }

    // Filter forecasts by date range
    const forecasts = weatherData.list.filter((f) => {
      const forecastDate = f.dt_txt.split(" ")[0];
      return forecastDate >= startDate && forecastDate <= endDate;
    });

    // 3️⃣ Get neighboring locations (~5 closest)
    const neighborRes = await fetch(
      `https://api.openweathermap.org/data/2.5/find?lat=${lat}&lon=${lon}&cnt=5&appid=${OPENWEATHER_API_KEY}&units=metric`
    );
    const neighborData = await neighborRes.json();

    return {
      city,
      coordinates: { lat, lon },
      startDate,
      endDate,
      forecast: forecasts.map((f) => ({
        date: f.dt_txt,
        temp: `${f.main.temp} °C`,
        condition: f.weather[0].description,
      })),
      neighbors: neighborData.list?.map((n) => ({
        city: n.name,
        temp: `${n.main.temp} °C`,
        condition: n.weather[0].description,
      })) || [],
    };
  } catch (err) {
    console.error("❌ Weather API error:", err);
    return { error: "Failed to fetch weather data." };
  }
}

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
    console.log("DEBUG returning:", result);

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
  console.log("✅ Weather MCP server running...");
}
